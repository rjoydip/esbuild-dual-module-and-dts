export const bar: string = 'bar'
export function getBarSync(): string {
  return bar
}
export async function getBarAsync(): Promise<string> {
  return Promise.resolve(bar)
}
