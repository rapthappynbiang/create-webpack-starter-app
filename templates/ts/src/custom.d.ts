declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  import React = require("react");

  export const src: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  // const src: string;
  export default src;
}
