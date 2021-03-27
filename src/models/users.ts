export interface User {
  _id: string,
  discord: {
    id: string,
    token?: string,
  },
  canvas: {
    id?: string,
    token?: string,
  },
  courses?: string[],
}
