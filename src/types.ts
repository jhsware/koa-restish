export type THandler = {
  pathname: string;
  handler: Function;
}

export type THandlers = {
  create: THandler[],
  query: THandler[],
  update: THandler[],
  delete: THandler[],
}
