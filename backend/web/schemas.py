from pydantic import BaseModel, Field


class WebSource(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class WebSearchResponse(BaseModel):
    query: str
    answer: str
    sources: list[WebSource] = Field(default_factory=list)
    route: str = "web"
    web_search_status: str = "success"
