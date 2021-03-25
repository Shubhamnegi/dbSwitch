interface Mapper {
  [K: string]: MapperDetail;
}

interface MapperDetail {
  fields: any;
  conversions: any;
}

