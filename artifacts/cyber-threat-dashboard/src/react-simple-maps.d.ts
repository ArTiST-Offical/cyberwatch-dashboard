declare module 'react-simple-maps' {
  import { ReactNode, ComponentType } from 'react';

  export interface GeographyProps {
    key: string;
    geography: any;
    [key: string]: any;
  }

  export interface EventProps {
    geographies: any[];
    projection: any;
    [key: string]: any;
  }

  export const ComposableMap: ComponentType<any>;
  export const Geographies: ComponentType<{
    children: (props: EventProps) => ReactNode;
    geography?: any;
  }>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<any>;
  export const ZoomableGroup: ComponentType<any>;
}
