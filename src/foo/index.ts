export const foo: string = 'foo'
export function getFooSync(): string {
  return foo
}
export async function getFooAsync(): Promise<string> {
  return Promise.resolve(foo)
}
