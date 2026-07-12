/**
 * Per-order production workflow: Local Buyer → Cutting → Stitching → Finishing & QC.
 * Each stage's OUTPUT becomes the next stage's INPUT, validated end-to-end so the
 * whole pipeline either flows or surfaces an explicit handoff issue.
 *
 * All values mock-derived from existing modules (orders / materials / expenses).
 */

import { ORDERS, type Order } from "@/data/orders";
import {
  MATERIAL_ORDERS, MATERIAL_SOURCES,
  type MaterialOrderSummary, type MaterialRequirement,
} from "@/data/materials";
import { CUTTING, STITCHING, FINISHING, sumLocalBuyer, LOCAL_BUYER } from "@/data/expenses";

export type StageKey = "local-buyer" | "cutting" | "stitching" | "finishing";

export type StageHandoff = {
  inputLabel: string;
  inputValue: string;
  outputLabel: string;
  outputValue: string;
  /** Number of units flowing in (kg or pcs). */
  inputQty: number;
  /** Number of units flowing out (kg or pcs). */
  outputQty: number;
  /** Loss in this stage (waste, reject). */
  loss: number;
  unit: "kg" | "pcs";
};

export type StageStatus = "pending" | "ready" | "in-progress" | "blocked" | "done";

export type WorkflowStage = {
  key: StageKey;
  label: string;
  href: string;
  cost: number;
  status: StageStatus;
  blocker?: string;          // e.g. "Cutting output 0 — cannot start stitching"
  handoff: StageHandoff;
  meta?: { label: string; value: string }[];
};

export type OrderWorkflow = {
  orderId: string;
  client: string;
  product: string;
  qty: number;
  stages: WorkflowStage[];
  /** Computed pipeline yield: finished good pcs / order qty. */
  pipelineYield: number;
  totalCost: number;
};

/* ----------------------------- Helpers ----------------------------- */

function findOrder(orderId: string): Order | undefined {
  return ORDERS.find((o) => o.id === orderId);
}

function findMaterialOrder(orderId: string): MaterialOrderSummary | undefined {
  return MATERIAL_ORDERS.find((m) => m.orderId === orderId);
}

/** Estimate fabric kg sourced via Local Buyer (only the "fabric" category lines). */
function fabricKgFromMaterials(mat: MaterialOrderSummary | undefined): number {
  if (!mat) return 0;
  return mat.requirements
    .filter((r) => r.category === "fabric" && r.unit === "kg")
    .reduce((s, r) => s + r.required, 0);
}

function localBuyerCost(mat: MaterialOrderSummary | undefined): number {
  // Anchor demo order uses the LOCAL_BUYER ledger; all others derive from material lines.
  if (mat?.orderId === "ORD-2026-024") return sumLocalBuyer(LOCAL_BUYER);
  if (!mat) return 0;
  return mat.requirements
    .filter((r) => r.source === "local-buyer-fabric" || r.source === "local-buyer-thread")
    .reduce((s, r) => s + r.required * r.unitCost, 0);
}

function stitchingCost(): number {
  return STITCHING.stitched * STITCHING.rate;
}

/** Status derives from order lifecycle; later stages can be blocked by upstream loss. */
function stageStatusFromOrder(stage: StageKey, o: Order, blocked: boolean): StageStatus {
  if (blocked) return "blocked";
  const idx: Record<StageKey, number> = { "local-buyer": 0, cutting: 1, stitching: 2, finishing: 3 };
  const lifecycleStep =
    o.status === "draft" ? -1 :
    o.status === "active" ? 0 :
    o.status === "in-production" ? 2 :
    o.status === "qc-hold" ? 3 :
    o.status === "completed" || o.status === "dispatched" ? 4 :
    o.status === "overdue" ? 2 : 0;
  const i = idx[stage];
  if (i < lifecycleStep) return "done";
  if (i === lifecycleStep) return "in-progress";
  if (i === lifecycleStep + 1) return "ready";
  return "pending";
}

/* ----------------------------- Builder ----------------------------- */

/**
 * Compute the per-order pipeline. For the anchor order (ORD-2026-024) we use the
 * full demo dataset (CUTTING / STITCHING / FINISHING). For other orders we
 * derive plausible mock values from order qty + material lines so every order
 * gets a coherent, end-to-end pipeline.
 */
export function getOrderWorkflow(orderId: string): OrderWorkflow | undefined {
  const o = findOrder(orderId);
  if (!o) return undefined;
  const mat = findMaterialOrder(orderId);
  const isAnchor = orderId === "ORD-2026-024";

  /* 1 — Local Buyer (procurement) */
  const fabricKg = isAnchor ? CUTTING.receivedKg : Math.max(60, fabricKgFromMaterials(mat) || Math.round(o.qty * 0.3));
  const buyerCost = localBuyerCost(mat);
  const buyerSuppliers = isAnchor
    ? Array.from(new Set(LOCAL_BUYER.map((l) => l.supplier))).length
    : (mat?.requirements.filter((r) => r.supplier).map((r) => r.supplier!).filter((v, i, a) => a.indexOf(v) === i).length ?? 0);

  /* 2 — Cutting */
  const cuttingReceivedKg = fabricKg;
  const cuttingWasteKg = isAnchor ? CUTTING.wastageKg : +(cuttingReceivedKg * 0.06).toFixed(1);
  const cutPcs = isAnchor
    ? CUTTING.cutPerSize.reduce((s, r) => s + r.qty, 0)
    : Math.round(o.qty * 0.99); // assume near 1:1 cut
  const cutWages = isAnchor ? CUTTING.wages : Math.round(cutPcs * 35);

  /* 3 — Stitching */
  const stitchSent = isAnchor ? STITCHING.sent : cutPcs;
  const stitched = isAnchor ? STITCHING.stitched : Math.round(stitchSent * 0.965);
  const stitchRejected = isAnchor ? STITCHING.rejected : Math.round(stitched * 0.02);
  const stitchCost = isAnchor ? stitchingCost() : Math.round(stitched * 240);

  /* 4 — Finishing & QC */
  const finReceived = isAnchor ? FINISHING.receivedPcs : stitched;
  const finPacked = isAnchor ? FINISHING.packed : Math.round(finReceived * 0.965);
  const finFailed = isAnchor ? FINISHING.qcFail : finReceived - finPacked;
  const finCost = isAnchor ? FINISHING.wages : Math.round(finReceived * 25);

  /* Handoff validation — mark a stage as blocked when its upstream output is zero. */
  const cutBlocked = cuttingReceivedKg <= 0;
  const stitchBlocked = stitchSent <= 0;
  const finishBlocked = finReceived <= 0;

  const stages: WorkflowStage[] = [
    {
      key: "local-buyer",
      label: "Local Buyer",
      href: "/expenses/local-buyer",
      cost: buyerCost,
      status: stageStatusFromOrder("local-buyer", o, false),
      handoff: {
        inputLabel: "Material requirement",
        inputValue: `${fabricKg.toLocaleString()} kg`,
        outputLabel: "Procured fabric",
        outputValue: `${fabricKg.toLocaleString()} kg`,
        inputQty: fabricKg, outputQty: fabricKg, loss: 0, unit: "kg",
      },
      meta: [
        { label: "Suppliers engaged", value: String(buyerSuppliers) },
        { label: "Procurement spend", value: buyerCost.toLocaleString("en-PK") },
      ],
    },
    {
      key: "cutting",
      label: "Cutting",
      href: "/expenses/cutting",
      cost: cutWages,
      status: stageStatusFromOrder("cutting", o, cutBlocked),
      blocker: cutBlocked ? "No fabric received from Local Buyer." : undefined,
      handoff: {
        inputLabel: "Fabric received",
        inputValue: `${cuttingReceivedKg.toLocaleString()} kg`,
        outputLabel: "Pieces cut",
        outputValue: `${cutPcs.toLocaleString()} pcs`,
        inputQty: cuttingReceivedKg, outputQty: cutPcs, loss: cuttingWasteKg, unit: "pcs",
      },
      meta: [
        { label: "Wastage", value: `${cuttingWasteKg} kg` },
        { label: "Cutting wages", value: cutWages.toLocaleString("en-PK") },
      ],
    },
    {
      key: "stitching",
      label: "Stitching",
      href: "/expenses/stitching",
      cost: stitchCost,
      status: stageStatusFromOrder("stitching", o, stitchBlocked),
      blocker: stitchBlocked ? "No cut pieces handed over from Cutting." : undefined,
      handoff: {
        inputLabel: "Sent for stitching",
        inputValue: `${stitchSent.toLocaleString()} pcs`,
        outputLabel: "Pieces stitched",
        outputValue: `${stitched.toLocaleString()} pcs`,
        inputQty: stitchSent, outputQty: stitched, loss: stitchRejected, unit: "pcs",
      },
      meta: [
        { label: "Rejected", value: `${stitchRejected.toLocaleString()} pcs` },
        { label: "Stitching wages", value: stitchCost.toLocaleString("en-PK") },
      ],
    },
    {
      key: "finishing",
      label: "Finishing & QC",
      href: "/expenses/finishing",
      cost: finCost,
      status: stageStatusFromOrder("finishing", o, finishBlocked),
      blocker: finishBlocked ? "No stitched pieces handed over from Stitching." : undefined,
      handoff: {
        inputLabel: "Received from stitching",
        inputValue: `${finReceived.toLocaleString()} pcs`,
        outputLabel: "Packed (good)",
        outputValue: `${finPacked.toLocaleString()} pcs`,
        inputQty: finReceived, outputQty: finPacked, loss: finFailed, unit: "pcs",
      },
      meta: [
        { label: "QC failed", value: `${finFailed.toLocaleString()} pcs` },
        { label: "Finishing wages", value: finCost.toLocaleString("en-PK") },
      ],
    },
  ];

  const totalCost = stages.reduce((s, st) => s + st.cost, 0);
  const pipelineYield = o.qty > 0 ? +((finPacked / o.qty) * 100).toFixed(1) : 0;

  return {
    orderId: o.id,
    client: o.client,
    product: o.product,
    qty: o.qty,
    stages,
    pipelineYield,
    totalCost,
  };
}

export const STAGE_LABEL: Record<StageKey, string> = {
  "local-buyer": "Local Buyer",
  cutting: "Cutting",
  stitching: "Stitching",
  finishing: "Finishing & QC",
};

/** Helper kept for symmetry with materials.ts so callers can re-export sourcing labels. */
export { MATERIAL_SOURCES };
export type { MaterialRequirement };