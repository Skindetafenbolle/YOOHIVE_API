export interface UpdateCompanyDto {
  id: number;
  name?: string;
  description?: string;
  address?: string;
  source?: string;
  affiliation?: string;
  subscription?: string;
  category?: string;
  subcategories?: string[];
  tags?: string[];
}
