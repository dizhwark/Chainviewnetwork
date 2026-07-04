from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class FactorExposureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    as_of_date: date
    model_name: str
    alpha_annualized: float
    r_squared: float
    mkt_rf_beta: float
    smb_beta: float
    hml_beta: float
    rmw_beta: float
    cma_beta: float
    mom_beta: float
    created_at: datetime
