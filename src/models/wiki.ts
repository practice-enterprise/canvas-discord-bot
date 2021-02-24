export interface WikiPage {
  id: string | number;
  title: string
  description: string;
  path: string;
  locale: string;
}

export interface WikiResults {
  data:{
    pages: {
      search: {
        results: WikiPage[]
      }
    }
  }
}
