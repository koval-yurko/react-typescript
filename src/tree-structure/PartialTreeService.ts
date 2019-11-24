import { TreeServiceI, TreeNode, TreeNodeMetadata } from './types';
import { CellMeasureCacheI } from '../grid-size/types';

/**
 * Projection on main TreeService with partial data tree from "from" to "to".
 * @class
 */
export class PartialTreeService implements TreeServiceI {
    treeService: TreeServiceI;
    from: number = 0;
    to: number = 0;

    grid?: Array<Array<any>>;

    constructor(treeService: TreeServiceI, from: number, to: number) {
        this.treeService = treeService;
        const count = this.treeService.getTreeChildLength();
        const fixedTo = Math.min(count, to);

        this.from = from;
        this.to = fixedTo;
    }

    destroy() {
        this.treeService.destroy();
        this.grid = undefined;
    }

    /**
     * Returns grid (2d list) of tree structure
     *
     * @returns {Array<Array<TreeNode | string>>} - 2d list
     */
    getGrid(): Array<Array<TreeNode | string>> {
        if (!this.grid) {
            this.grid = this.treeService.getPartialGrid(this.from, this.to);
        }
        return this.grid;
    }

    /**
     * Returns TreeNode item if exist for appropriate coordinates (rowIndex, columnIndex)
     *
     * @param {number} rowIndex - row index
     * @param {number} columnIndex - column index
     * @returns {TreeNode|null} - TreeNode item
     */
    getTreeNode(rowIndex: number, columnIndex: number): TreeNode | undefined {
        return this.treeService.getTreeNode(rowIndex, columnIndex);
    }

    /**
     * Defines if cell with (rowIndex, columnIndex) coordinate is children cell or main one
     *
     * @param {number} rowIndex - row index of the cell
     * @param {number} columnIndex - column index of the cell
     * @returns {boolean} - true - if children, false if main one
     */
    isChildren(rowIndex: number, columnIndex: number): boolean {
        return this.treeService.isChildren(rowIndex, columnIndex);
    }

    /**
     * Defines if cell with (rowIndex, columnIndex) coordinate has children column/row cells or not
     *
     * @param {number} rowIndex - row index of the cell
     * @param {number} columnIndex - column index of the cell
     * @returns {boolean} - true - has children column/row cells, false - does not have
     */
    hasChildren(rowIndex: number, columnIndex: number): boolean {
        return this.treeService.hasChildren(rowIndex, columnIndex);
    }

    /**
     * Updates cache object according to main/children cells changes
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {CellMeasureCacheI} cache - cache object to update
     * @param {number} width - cell width
     * @param {number} height - cell height
     * @returns {null | { affectedRowsCount: number, affectedColumnsCount: number }} - returns
     * count of affected rows/columns for master cell
     */
    setCellCache(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI,
        width: number,
        height: number
    ): (null | { affectedRowsCount?: number, affectedColumnsCount?: number }) {
        return this.treeService.setCellCache(rowIndex, columnIndex, cache, width, height);
    }

    /**
     * Returns cell size cache
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {CellMeasureCacheI} cache - cache object to update
     * @returns {{width: number, height: number}} - cell sizes
     */
    getCellCache(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI
    ): { width: number, height: number } {
        return this.treeService.getCellCache(rowIndex, columnIndex, cache);
    }

    /**
     * Updates merge object for the cell if it has children cells
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @returns {Object} - new merge object
     */
    getMainCellSpans(
        rowIndex: number,
        columnIndex: number
    ): { colSpan?: number, rowSpan?: number } {
        return this.treeService.getMainCellSpans(rowIndex, columnIndex);
    }

    /**
     * Check for initial cell width including child cells for merged
     *
     * @param  {number} rowIndex - row index
     * @param  {number} columnIndex - column index
     * @param  {CellMeasureCacheI} cache - cache instance
     * @returns {boolean} - true - has initial width
     */
    hasInitialColumnWidth(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI
    ): boolean {
        return this.treeService.hasInitialColumnWidth(rowIndex, columnIndex, cache);
    }

    /**
     * Align start index in case of long merged cell
     *
     * @param {number} startIndex - initial start index
     * @param {boolean} isVertical - defines if it is vertical grid or not
     * @returns {number} - new start index
     */
    alignStartIndex(startIndex: number, isVertical?: boolean): number {
        const start = this.treeService.alignStartIndex(startIndex, isVertical);
        return Math.max(this.from, start);
    }

    /**
     * Align stop index in case of long merged cell
     *
     * @param {number} stopIndex - initial stop index
     * @param {boolean} isVertical - defines if it is vertical grid or not
     * @returns {number} - new stop index
     */
    alignStopIndex(stopIndex: number, isVertical?: boolean): number {
        const stop = this.treeService.alignStopIndex(stopIndex, isVertical);
        return Math.min(this.to - 1, stop);
    }

    /**
     * Returns number of last children for the tree
     *
     * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
     * @returns {number} - count of last children
     */
    getTreeChildLength(item?: (TreeNode[] | TreeNode)): number {
        const res = Math.max(0, this.to - this.from);
        if (item) {
            return res;
        }
        return res;
    }

    /**
     * Returns deep level of the tree
     *
     * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
     * @returns {number} - count of last children
     */
    getTreeDeepsLength(item?: (TreeNode[] | TreeNode)): number {
        return this.treeService.getTreeDeepsLength(item);
    }

    /**
     * Returns array of last tree nodes
     *
     * @returns {Array<TreeNode>} - list of tree nodes
     */
    getLastLevelNodes(): Array<TreeNode> {
        const parentLastLevel = this.treeService.getLastLevelNodes();
        return parentLastLevel.slice(this.from, this.to);
    }

    /**
     * Extract 2D array of data base on columnsTreeService
     *
     * @param {TreeServiceI} columnsTreeService - tree service according to which align the data
     * @returns {Array<Array<any>>} - 2D array of data
     */
    extractData(columnsTreeService?: TreeServiceI): Array<Array<any>> {
        if (!columnsTreeService) {
            return [];
        }
        const columsLastNodes = columnsTreeService.getLastLevelNodes();
        const sortIndexes = columsLastNodes.map(node => node.index);

        return this.getLastLevelNodes().map((node) => {
            if (typeof node.data === 'undefined') {
                return [node.data];
            }
            if (sortIndexes) {
                return sortIndexes.map((index) => {
                    let data = null;
                    if (typeof index !== 'undefined' && node.data) {
                        data = node.data[index];
                    }
                    return data;
                });
            }
            return node.data;
        });
    }

    /**
     * Returns cell meta information
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {{ maxCount: number }} [options] - additional configuration options
     * @returns {{levels: Array<string>, siblings: Array<string>}} - meta information
     */
    getMetadata(
        rowIndex: number,
        columnIndex: number,
        options?: { from: number, to: number }
    ): TreeNodeMetadata | undefined {
        return this.treeService.getMetadata(rowIndex, columnIndex, options);
    }

    /**
     * Sets value node when it's single
     *
     * @param {TreeNode} valueNode - values measure node
     * @returns {void}
     */
    setValueNode(valueNode: TreeNode): void {
        throw new Error('Should not be used in PartialTreeService');
        // $FlowFixMe
        console.error(valueNode, this); // eslint-disable-line no-console, no-unreachable
    }

    getPartialGrid(from: number, to: number): Array<Array<TreeNode | string>> {
        throw new Error('Should not be used in PartialTreeService');
        // $FlowFixMe
        this.treeService.getPartialGrid(from, to); // eslint-disable-line no-unreachable
    }

    getPartialTree(from: number, to?: number): Array<TreeNode> {
        throw new Error('Should not be used in PartialTreeService');
    }

    extend(tree?: TreeNode): void {
        throw new Error('Should not be used in PartialTreeService');
    }

    createPartialTreeService(from: number, to: number): TreeServiceI | undefined {
        throw new Error('Should not be used in PartialTreeService');
    }

    /**
     * Get sum of width or height of merge cells
     *
     * @param {CellMeasureCacheI} cache - object to update
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {{ number, number }} style - desc
     * @returns {{ number, number }} style - return style object
     */
    getMainCellSize(
        cache: CellMeasureCacheI,
        rowIndex: number,
        columnIndex: number,
        style: {width: number, height: number}
    ): {width: number, height: number} {
        return this.treeService.getMainCellSize(
            cache,
            rowIndex,
            columnIndex,
            style, { offsetTop: this.from }
        );
    }

    createPaginatedPartialTreeService(from: number, to: number): TreeServiceI | undefined {
        throw new Error('Should not be used in PartialTreeService');
    }
}

export default PartialTreeService;
