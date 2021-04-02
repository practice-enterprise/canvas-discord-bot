import Axios from 'axios';
import { WikiResults } from '../models/wiki';

export class WikiService {
  static async wiki(searchQuery: string): Promise<WikiResults> {
    return Axios.request<WikiResults>({
      headers: { 
        'Content-Type': 'application/json'
      },
      method: 'POST',
      baseURL: 'https://tmwiki.be',
      url: '/graphql',
      data: //'{"query":"query Query {  pages {    list {      title    }  }}"}'
    
      {
        query: 
          `query($searchQuery: String!) {
            pages {
              search(query: $searchQuery) {
                results {
                  id
                  title
                  description
                  path
                  locale
                }
              }
            }
          }`,
        variables:`{"searchQuery":"${searchQuery}"}`
      }
    }).then((res) => res.data);
  }
}
