import { CrudService } from '../../../shared/helpers/crud.js';

export class PageService extends CrudService {
  constructor({ pageRepository }) {
    super(pageRepository, { entity: 'Page', slugFrom: 'title' });
  }
}
