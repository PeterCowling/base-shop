import * as React from "react";
export interface ProductFeaturesProps extends React.HTMLAttributes<HTMLUListElement> {
    features: string[];
}
export declare function ProductFeatures({ features, className, ...props }: ProductFeaturesProps): React.JSX.Element;
