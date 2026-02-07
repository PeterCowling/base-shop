declare module "validator/lib/isURL" {
  import validator from "validator";

  const isURL: typeof validator.isURL;
  export default isURL;
}
