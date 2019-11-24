import { AbstractTreeService } from './AbstractTreeService';
import { PartialTreeService } from './PartialTreeService';
import { PaginatedPartialTreeService } from './PaginatedPartialTreeService';
import { TreeServiceI } from './types';


/**
 * TreeService converts tree structure into grid structure, also it keeps inner grid structure
 * to update cache system (via setCellCache) and receive merged cells (via updateMainCellMargins)
 * @class
 * @augments AbstractTreeService
 */
export class TreeService extends AbstractTreeService {
    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PartialTreeService} - - new TreeService
     */
    createPartialTreeService(from: number, to: number): TreeServiceI {
        const count = this.getTreeChildLength();
        const fixedTo = Math.min(count, to);
        return new PartialTreeService(this, from, fixedTo);
    }

    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PartialTreeService} - - new TreeService
     */
    createPaginatedPartialTreeService(from: number, to: number): TreeServiceI {
        const count = this.getTreeChildLength();
        const fixedFrom = Math.max(from, 0);
        const fixedTo = Math.min(count, to);
        return new PaginatedPartialTreeService(
            this.tree,
            this.isVertical,
            this.deep,
            fixedFrom,
            fixedTo
        );
    }
}

export default TreeService;
