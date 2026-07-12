import { revalidatePath } from 'next/cache'

export function revalidateOrders() {
  revalidatePath('/orders')
  revalidatePath('/')
  revalidatePath('/materials')
}
