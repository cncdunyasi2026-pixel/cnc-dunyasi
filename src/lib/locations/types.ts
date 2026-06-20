export type Province = {
  id: string;
  name: string;
};

export type District = {
  id: string;
  ilId: string;
  name: string;
};

export type Village = {
  id: string;
  ilceId: string;
  name: string;
};

export type Neighborhood = {
  id: string;
  koyId: string;
  name: string;
};

export type NeighborhoodOption = {
  id: string;
  label: string;
};

export type LocationSelection = {
  city: string;
  district: string;
  neighborhood: string;
};
