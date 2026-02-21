declare module "jest-mock" {
  export type Mock<T = any, Y extends any[] = any, C = any> = jest.Mock<T, Y, C>;
}
