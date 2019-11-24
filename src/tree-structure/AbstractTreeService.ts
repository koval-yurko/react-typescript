import { TreeCellMap } from './TreeCellMap';
import { treeNode } from './utils';
import { Position } from './constants';
// import { keyCreator } from '../components/TableGrid/utils/index';
import { TreeServiceI, TreeCellMapI, TreeNode, TreeNodeMetadata } from './types';
import { CellMeasureCacheI } from '../grid-size/types';

type TreeCellMapCache = {
    [key: string]: TreeCellMapI
}

type TreeNodeMetadataCache = {
    [key: string]: TreeNodeMetadata
}

type FillMapState = {
    parentRowIndex: number,
    parentColIndex: number,
    prevChildren: number,
    parentKey: string,
};

const keyCreator = (rowIndex: number, columnIndex: number): string =>
    `${rowIndex}-${columnIndex}`;

/**
 * AbstractTreeService required as parent class to solve circular dependencies
 * TreeService converts tree structure into grid structure, also it keeps inner grid structure
 * to update cache system (via setCellCache) and receive merged cells (via updateMainCellMargins)
 * @class
 * @abstract
 * @private
 */
export class AbstractTreeService implements TreeServiceI {
    tree?: TreeNode;
    /**
     * Defines if tree will be converted to vertical or horizontal grid
     *
     * @private
     * */
    isVertical: boolean = false;
    deep?: number;
    /**
     * Cache tree nodes by deep levels
     *
     * @private
     * */
    columns: Array<Array<TreeNode>> = [];
    /**
     * Cache last levels tree nodes
     *
     * @private
     * */
    lastLevel: Array<any> = [];
    /**
     * Mapping object between tree<>grid
     *
     * @private
     * */
    map: TreeCellMapCache = {};
    /**
     * Metadata cache object
     *
     * @private
     * */
    metadataCache: TreeNodeMetadataCache = {};
    /**
     * Keep value node if it only one
     *
     * @private
     * */
    valueNode?: TreeNode;
    /**
     * Final 2D array
     *
     * @private
     * */
    grid?: Array<Array<any>>;

    constructor(tree?: TreeNode, isVertical: boolean = false, deep?: number) {
        this.isVertical = isVertical;
        this.deep = deep;
        if (tree) {
            this.tree = tree;
            this.columns = this.cacheLevels(treeNode.getChildren(this.tree));
        }
    }

    destroy() {
        this.tree = undefined;
        this.columns = [];
        this.lastLevel = [];
        this.map = {};
        this.metadataCache = {};
        this.valueNode = undefined;
        this.grid = undefined;
    }

    /**
     * Get sum of width or height of merge cells
     *
     * @param {CellMeasureCacheI} cache - object to update
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {Object} style - style object
     * @param {number} style.width - cell width
     * @param {number} style.height - cell height
     * @param {Object} [options] - offset object
     * @param {number} [options.offsetTop] - row offset from index
     * @param {number} [options.columnsOffset] - columns offset in cache object
     * @returns {{ number, number }} style - return style object
     */
    getMainCellSize(
        cache: CellMeasureCacheI,
        rowIndex: number,
        columnIndex: number,
        style: { width: number, height: number },
        options: {
            offsetTop?: number,
            columnsOffset?: number,
        } = { offsetTop: -1, columnsOffset: 0 }
    ): { width: number, height: number } {
        const { offsetTop = -1, columnsOffset = 0 } = options;
        let item: TreeCellMapI | undefined = this.getItem(rowIndex, columnIndex);
        let hasColCache = true;
        let hasRowCache = true;

        // if item is child get parent item
        if (item && this.isChildren(rowIndex, columnIndex)) {
            // get parent indexes
            const rowAndColumnIndexes = item.getParenPosition();
            if (rowAndColumnIndexes) {
                const [row, column] = rowAndColumnIndexes;
                // get parent item
                item = this.getItem(Number(row), Number(column));
            }
        }

        // get merged width for column
        const isMergedColumn = item && item.hasChildren() && item.hasColCell();

        if (item && isMergedColumn) {
            const childColCells = item.getColCell();
            const parentItemWidth = cache.columnWidth({ index: columnIndex + columnsOffset });

            style.width = childColCells.reduce((prev, curr) => {
                if (
                    !cache.hasInitialColumnWidth(curr.colIndex + columnsOffset) &&
                    !cache.has(rowIndex, curr.colIndex + columnsOffset)
                ) {
                    hasColCache = false;
                }
                return prev + cache.columnWidth({ index: curr.colIndex + columnsOffset });
            }, parentItemWidth);
            style.width = Math.ceil(style.width);
        }

        // get merged height for row
        const isMergedRow = item && item.hasChildren() && item.hasRowCell();

        if (item && isMergedRow) {
            const childRowCells = item.getRowCell();
            const parentRowIndex = item.rowIndex;

            // if item is out of vision set item to 0 value
            let parentItemHeight = 0;
            if (parentRowIndex > offsetTop) {
                parentItemHeight = cache.rowHeight({ index: parentRowIndex });
            }

            // if child items is out of vision set item to 0 value
            const filtered = childRowCells.filter(child => child.rowIndex >= offsetTop);

            style.height = filtered.reduce((prev, curr) => {
                if (!cache.has(curr.rowIndex, columnIndex + columnsOffset)) {
                    hasRowCache = false;
                }
                return prev + cache.rowHeight({ index: curr.rowIndex });
            }, parentItemHeight);
            style.height = Math.ceil(style.height);
        }

        if (!hasColCache) {
            delete style.width;
        }

        if (!hasRowCache) {
            delete style.height;
        }

        return style;
    }

    /**
     * Adds additional tree node to current state
     *
     * @param {TreeNode} tree - new treeNode
     * @returns {void}
     */
    extend(tree?: TreeNode) {
        if (tree) {
            this.grid = undefined;
            this.tree = treeNode.merge(this.tree, tree);
            this.columns = this.cacheLevels(treeNode.getChildren(tree), this.columns);
        }
    }

    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PartialTreeService} - - new TreeService
     */
    createPartialTreeService(from: number, to: number): TreeServiceI {
        throw new Error('Should not be used in AbstractTreeService');
    }

    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PaginatedPartialTreeService} - - new TreeService
     */
    createPaginatedPartialTreeService(from: number, to: number): TreeServiceI {
        throw new Error('Should not be used in AbstractTreeService');
    }

    /**
     * Returns grid (2d list) of tree structure
     *
     * @returns {Array<Array<TreeNode | string>>} - 2d list
     */
    getGrid(): Array<Array<TreeNode | string>> {
        if (this.grid) {
            return this.grid;
        }
        let rows = this.getTreeDeepsLength();
        let cols = this.getTreeChildLength();
        if (this.isVertical) {
            [rows, cols] = [cols, rows];
            this.map = this.fillMapVertical(treeNode.getChildren(this.tree), cols, this.map);
        } else {
            this.map = this.fillMap(treeNode.getChildren(this.tree), rows, this.map);
        }

        this.grid = Array.from(Array(rows)).map((rO, rowIndex) => (
            Array.from(Array(cols)).map((cO, colIndex) => {
                const key = keyCreator(rowIndex, colIndex);
                const mapItem = this.map[key];
                if (!mapItem) {
                    throw new Error(`Key "${key}" does not found in TreeService`);
                }
                return mapItem.node ? mapItem.node : mapItem.parent;
            })
        ));

        return this.grid;
    }

    /**
     * Returns part of current grid according to "from" - "to" position
     *
     * @param {number} from - start rows index for partial grid
     * @param {number} to - stop rows index for partial grid
     * @returns {Array<Array<TreeNode | string>>} - partial grid
     */
    getPartialGrid(from: number, to: number): Array<Array<TreeNode | string>> {
        if (!this.isVertical) {
            throw new Error('"getPartialGrid" can only be used for "vertical" tree');
        }

        const cols = this.getTreeDeepsLength();

        const treeChild = treeNode.getChildren(this.tree);
        const { nodes, start, stop } = treeNode.getNodesByChildCount(treeChild, from, to);

        this.fillMapVertical(nodes, cols, this.map, {
            parentRowIndex: start,
            parentColIndex: 0,
            prevChildren: 0,
            parentKey: '',
        });

        const finalFrom = Math.max(start, from);
        const finalTo = Math.min(stop, to);
        const finalCount = Math.max(0, finalTo - from);

        return Array.from(Array(finalCount)).map((rO, rowIndex) => (
            Array.from(Array(cols)).map((cO, colIndex) => {
                const index = finalFrom + rowIndex;
                const key = keyCreator(index, colIndex);
                const mapItem = this.map[key];
                if (!mapItem) {
                    throw new Error(`Key "${key}" does not found in TreeService`);
                }
                return mapItem.node ? mapItem.node : (mapItem.parent || '');
            })
        ));
    }

    /**
     * Returns part of current tree with possible cut nodes according to "from" - "to" position
     *
     * @param {number} from - start rows index for partial grid
     * @param {number} [to] - stop rows index for partial grid
     * @returns {Array<TreeNode>} - partial tree
     */
    getPartialTree(from: number, to?: number): Array<TreeNode> {
        const treeChild = treeNode.getChildren(this.tree);
        return treeNode.getCutNodesByChildCount(treeChild, from, to);
    }

    /**
     * Returns TreeNode item if exist for appropriate coordinates (rowIndex, columnIndex)
     *
     * @param {number} rowIndex - row index
     * @param {number} columnIndex - column index
     * @returns {TreeNode|null} - TreeNode item
     */
    getTreeNode(rowIndex: number, columnIndex: number): TreeNode | undefined {
        const mapItem = this.getItem(rowIndex, columnIndex);
        if (mapItem && mapItem.node) {
            return mapItem.node;
        }
        return undefined;
    }

    /**
     * Defines if cell with (rowIndex, columnIndex) coordinate is children cell or main one
     *
     * @param {number} rowIndex - row index of the cell
     * @param {number} columnIndex - column index of the cell
     * @returns {boolean} - true - if children, false if main one
     */
    isChildren(rowIndex: number, columnIndex: number): boolean {
        const item: TreeCellMapI | undefined = this.getItem(rowIndex, columnIndex);
        if (item) {
            return item.isChild();
        }
        if (typeof this.deep === 'number') {
            if ((this.isVertical ? columnIndex : rowIndex) < this.deep) {
                return true;
            }
        }
        throw new Error(`Item "${rowIndex}-${columnIndex}" does not found in TreeService`);
    }

    /**
     * Defines if cell with (rowIndex, columnIndex) coordinate has children column/row cells or not
     *
     * @param {number} rowIndex - row index of the cell
     * @param {number} columnIndex - column index of the cell
     * @returns {boolean} - true - has children column/row cells, false - does not have
     */
    hasChildren(rowIndex: number, columnIndex: number): boolean {
        const item: TreeCellMapI | undefined= this.getItem(rowIndex, columnIndex);
        if (item) {
            return item.hasChildren();
        }
        throw new Error(`Item "${rowIndex}-${columnIndex}" does not found in TreeService`);
    }

    /**
     * Updates cache object according to main/children cells changes
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {CellMeasureCacheI} cache - cache object to update
     * @param {number} width - cell width
     * @param {number} height - cell height
     * @param {Object} [options] - additional configuration options
     * @param {number} [options.columnsOffset=0] - columns offset in cache object
     * @returns {null | { affectedRowsCount: number, affectedColumnsCount: number }} - returns
     * count of affected rows/columns for master cell
     */
    setCellCache(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI,
        width: number,
        height: number,
        options: { columnsOffset: number } = { columnsOffset: 0 }
    ): (null | { affectedRowsCount?: number, affectedColumnsCount?: number }) {
        const { columnsOffset = 0 } = options;
        const item: TreeCellMapI | undefined= this.getItem(rowIndex, columnIndex);
        const finalColumnIndex = columnIndex + columnsOffset;
        if (item && item.hasChildren()) {
            let affectedRowsCount = 0;
            let affectedColumnsCount = 0;
            let mainWidth = width;
            let mainHeight = height;
            if (item.hasColCell()) {
                mainWidth = width / (item.getColCell().length + 1);
            }
            if (item.hasRowCell()) {
                mainHeight = height / (item.getRowCell().length + 1);
            }
            const wereMainChanges = cache.set(rowIndex, finalColumnIndex, mainWidth, mainHeight);
            let wereColChanges = false;
            let wereRowChanges = false;
            if (item.hasColCell()) {
                wereColChanges = item.getColCell().map((childItem: TreeCellMapI) => {
                    affectedColumnsCount += 1;
                    const childColumnIndex = childItem.colIndex + columnsOffset;
                    return cache.set(childItem.rowIndex, childColumnIndex, mainWidth, mainHeight);
                }).filter(wereChanges => (wereChanges)).length > 1;
            }
            if (item.hasRowCell()) {
                wereRowChanges = item.getRowCell().map((childItem: TreeCellMapI) => {
                    affectedRowsCount += 1;
                    const childColumnIndex = childItem.colIndex + columnsOffset;
                    return cache.set(childItem.rowIndex, childColumnIndex, mainWidth, mainHeight);
                }).filter(wereChanges => (wereChanges)).length > 1;
            }
            if (wereMainChanges || wereColChanges || wereRowChanges) {
                return {
                    affectedRowsCount,
                    affectedColumnsCount,
                };
            }
            return null;
        } else if (item && item.isChild()) {
            return null;
        }
        const wereChanges = cache.set(rowIndex, finalColumnIndex, width, height);
        return wereChanges ? {} : null;
    }

    /**
     * Returns cell size cache
     *
     * @param {number} rowIndex - cell row index
     * @param {number} columnIndex - cell column index
     * @param {CellMeasureCacheI} cache - cache object to update
     * @param {Object} [options] - additional configuration options
     * @param {number} [options.columnsOffset=0] - columns offset in cache object
     * @returns {{width: number, height: number}} - cell sizes
     */
    getCellCache(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI,
        options: { columnsOffset: number } = { columnsOffset: 0 }
    ): { width: number, height: number } {
        const { columnsOffset = 0 } = options;
        const item: TreeCellMapI | undefined= this.getItem(rowIndex, columnIndex);
        const finalColumnIndex = columnIndex + columnsOffset;
        let width = cache.getWidth(rowIndex, finalColumnIndex);
        let height = cache.getHeight(rowIndex, finalColumnIndex);
        if (item && item.hasChildren()) {
            if (item.hasColCell()) {
                item.getColCell().forEach((childItem: TreeCellMapI) => {
                    const childColumnIndex = childItem.colIndex + columnsOffset;
                    width += cache.getWidth(childItem.rowIndex, childColumnIndex);
                });
            }
            if (item.hasRowCell()) {
                item.getRowCell().forEach((childItem: TreeCellMapI) => {
                    const childColumnIndex = childItem.colIndex + columnsOffset;
                    height += cache.getHeight(childItem.rowIndex, childColumnIndex);
                });
            }
        }
        return { width, height };
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
        const spans: { colSpan?: number, rowSpan?: number } = {};
        const mainItem: TreeCellMapI | undefined= this.getItem(rowIndex, columnIndex);

        if (mainItem && mainItem.hasColCell()) {
            spans.colSpan = mainItem.getColCell().length + 1;
        }

        if (mainItem && mainItem.hasRowCell()) {
            spans.rowSpan = mainItem.getRowCell().length + 1;
        }

        return spans;
    }

    /**
     * Check for initial cell width including child cells for merged
     *
     * @param  {number} rowIndex - row index
     * @param  {number} columnIndex - column index
     * @param  {CellMeasureCacheI} cache - cache instance
     * @param {Object} [options] - additional configuration options
     * @param {number} [options.columnsOffset=0] - columns offset in cache object
     * @returns {boolean} - true - has initial width
     */
    hasInitialColumnWidth(
        rowIndex: number,
        columnIndex: number,
        cache: CellMeasureCacheI,
        options: { columnsOffset: number } = { columnsOffset: 0 }
    ): boolean {
        const { columnsOffset = 0 } = options;
        const mainItem: TreeCellMapI | undefined= this.getItem(rowIndex, columnIndex);
        const hasInitialWidth = cache.hasInitialColumnWidth(columnIndex + columnsOffset);

        if (hasInitialWidth) {
            return hasInitialWidth;
        }

        if (mainItem && mainItem.hasChildren() && mainItem.hasColCell()) {
            const columnCount = mainItem.getColCell().length;
            const startSubColumnIndex = mainItem.colIndex;
            const stopSubColumnIndex = startSubColumnIndex + columnCount + 1;
            for (let i = startSubColumnIndex; i < stopSubColumnIndex; i += 1) {
                if (cache.hasInitialColumnWidth(i + columnsOffset)) {
                    return true;
                }
            }
        }

        return hasInitialWidth;
    }

    /**
     * Align start index in case of long merged cell
     *
     * @param {number} startIndex - initial start index
     * @param {boolean} isVertical - defines if it is vertical grid or not
     * @returns {number} - new start index
     */
    alignStartIndex(startIndex: number, isVertical: boolean = false): number {
        let row = 0;
        let col = startIndex;
        if (isVertical) {
            row = startIndex;
            col = 0;
        }
        if (this.isVertical === isVertical) {
            let curItem: TreeCellMapI | undefined= this.getItem(row, col);
            if (curItem && curItem.isChild()) {
                curItem = this.getItemByKey(curItem.parent || '');
            }
            if (curItem) {
                return isVertical ? curItem.rowIndex : curItem.colIndex;
            }
        }
        return startIndex;
    }

    /**
     * Align stop index in case of long merged cell
     *
     * @param {number} stopIndex - initial stop index
     * @param {boolean} isVertical - defines if it is vertical grid or not
     * @returns {number} - new stop index
     */
    alignStopIndex(stopIndex: number, isVertical: boolean = false): number {
        let row = 0;
        let col = stopIndex;
        if (isVertical) {
            row = stopIndex;
            col = 0;
        }
        if (this.isVertical === isVertical) {
            let curItem: TreeCellMapI | undefined= this.getItem(row, col);
            if (curItem && curItem.isChild()) {
                curItem = this.getItemByKey(curItem.parent || '');
            }
            if (curItem) {
                return isVertical ? curItem.getStopRowIndex() : curItem.getStopColIndex();
            }
        }
        return stopIndex;
    }

    /**
     * Returns number of last children for the tree
     *
     * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
     * @param {{ callCount: number, clearCache: boolean }} options - options for state
     * @returns {number} - count of last children
     */
    getTreeChildLength(
        item: (TreeNode[] | TreeNode | undefined) = treeNode.getChildren(this.tree),
        options?: { callCount?: number, clearCache?: boolean }
    ): number {
        return treeNode.getChildLength(item, options);
    }

    /**
     * Returns deep level of the tree
     *
     * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
     * @param {{ callCount: number, clearCache: boolean }} options - options for inner state
     * @returns {number} - count of last children
     */
    getTreeDeepsLength(
        item: (TreeNode[] | TreeNode | undefined) = treeNode.getChildren(this.tree),
        options?: { callCount?: number, clearCache?: boolean }
    ): number {
        if (typeof this.deep !== 'undefined' && this.deep !== null) {
            return this.deep;
        }
        return treeNode.getDeepLength(item, options);
    }

    /**
     * Returns array of last tree nodes
     *
     * @returns {Array<TreeNode>} - list of tree nodes
     */
    getLastLevelNodes(): Array<TreeNode> {
        return this.lastLevel;
    }

    /**
     * Extract 2D array of data base on columnsTreeService
     *
     * @param {TreeServiceI} columnsTreeService - tree service according to which align the data
     * @returns {Array<Array<any>>} - 2D array of data
     */
    extractData(columnsTreeService?: TreeServiceI): Array<Array<any>> {
        let sortIndexes: Array<number | undefined>;
        if (!columnsTreeService) {
            return [];
        }
        const columsLastNodes = columnsTreeService.getLastLevelNodes();
        sortIndexes = columsLastNodes.map(node => node.index);

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
     * @param {{ to: number }} [options] - additional configuration options
     * @returns {{levels: Array<string>, siblings: Array<string>}} - meta information
     */
    getMetadata(
        rowIndex: number,
        columnIndex: number,
        options?: { from: number, to: number }
    ): TreeNodeMetadata | undefined {
        const levelCount = this.getTreeDeepsLength();
        if (rowIndex === Infinity) {
            // eslint-disable-next-line no-param-reassign
            rowIndex = levelCount ? levelCount - 1 : levelCount;
        }
        if (columnIndex === Infinity) {
            // eslint-disable-next-line no-param-reassign
            columnIndex = levelCount ? levelCount - 1 : levelCount;
        }
        const key = `${rowIndex}-${columnIndex}`;
        if (this.metadataCache[key]) {
            return this.metadataCache[key];
        }
        let mapItem = this.getItemByKey(key);
        if (!mapItem) {
            throw new Error(`Can not find metadata info for ${key} cell`);
        }
        let nodeItem: TreeNode | undefined = mapItem ? mapItem.node : undefined;
        // looking for parent
        if (!nodeItem) {
            mapItem = this.getItemByKey(mapItem.parent || '');
        }
        if (!mapItem) {
            throw new Error(`Can not find metadata info for parent ${key} cell`);
        }
        nodeItem = mapItem ? mapItem.node : undefined;

        // levels info
        const level = (nodeItem && nodeItem.level) || 0;
        const lastLevel = this.isVertical ? mapItem.getStopColIndex() : mapItem.getStopRowIndex();
        // siblings info
        let { indexInParent, siblingCount } = mapItem.getIndexInParent();
        let lastIndexInParent = indexInParent;

        // fix sibling for partial tree top/first level
        if (level === 0) {
            siblingCount = this.getTreeChildLength();
            indexInParent = this.isVertical ? mapItem.rowIndex : mapItem.colIndex;
            lastIndexInParent = indexInParent +
                (this.isVertical ? mapItem.getRowCell().length : mapItem.getColCell().length);
        }

        if (options) {
            // pagination
            const maxCount = options.to - options.from;
            if (siblingCount <= maxCount && lastIndexInParent > maxCount - 1) {
                lastIndexInParent = maxCount - 1;
            }
        }

        const data: TreeNodeMetadata = {
            levels: [],
            siblings: [],
            root: undefined,
            parent: undefined,
            valueNode: this.valueNode,
        };
        const { indexDivergence } = (nodeItem || {});
        if (typeof indexDivergence === 'number') {
            const siblingsStatus =
                indexDivergence === 0 ?
                    Position.EVEN :
                    Position.ODD;
            data.siblings.push(siblingsStatus);
        }

        if (level === 0) {
            data.levels.push(Position.FIRST);
        }
        if (lastLevel === levelCount - 1) {
            data.levels.push(Position.LAST);
        }
        if (indexInParent === 0) {
            data.siblings.push(Position.FIRST);
        }
        if (lastIndexInParent === siblingCount - 1) {
            data.siblings.push(Position.LAST);
        }

        // get root node
        if (nodeItem && level !== 0) {
            const rootRowIndex = this.isVertical ? rowIndex : 0;
            const rootColumnIndex = this.isVertical ? 0 : columnIndex;
            data.root = this.getMetadata(rootRowIndex, rootColumnIndex, options);
        }

        const parentMapItem = this.getItemByKey(mapItem.parent || '');

        // get parent node
        if (parentMapItem && level !== 0) {
            data.parent = this.getMetadata(parentMapItem.rowIndex, parentMapItem.colIndex, options);
        }

        if (options) {
            // pagination
            const startIndex = this.isVertical ? mapItem.rowIndex : mapItem.colIndex;
            const stopIndex = this.isVertical
                ? mapItem.getStopRowIndex()
                : mapItem.getStopColIndex();
            let parentStopIndex = null;
            if (parentMapItem) {
                parentStopIndex = this.isVertical
                    ? parentMapItem.getStopRowIndex()
                    : parentMapItem.getStopColIndex();
            }

            if (parentStopIndex !== null && parentStopIndex >= options.to - options.from) {
                // item is cut
                if (stopIndex >= options.to - options.from - 1 &&
                    data.siblings.indexOf(Position.LAST) < 0
                ) {
                    data.siblings.push(Position.LAST);
                }
            }

            if (startIndex === 0 && data.siblings.indexOf(Position.FIRST) < 0) {
                // in paginated case we always has min cell
                data.siblings.push(Position.FIRST);
            }
        }

        this.metadataCache[key] = data;

        return data;
    }

    /**
     * Sets value node when it's single
     *
     * @param {TreeNode} valueNode - values measure node
     * @returns {void}
     */
    setValueNode(valueNode: TreeNode): void {
        if (typeof valueNode === 'object') {
            this.valueNode = valueNode;
        }
    }

    /**
     * Fills cache object with nodes by appropriate deep level
     *
     * @param {Array<TreeNode>} list - list of nodes to cache
     * @param {Array<Array<TreeNode>>} cache - cache object
     * @param {{level: number }} options - internal recursive state
     * @returns {Array<Array<TreeNode>>} - cache object
     * @private
     */
    cacheLevels(
        list: Array<TreeNode>,
        cache: Array<Array<TreeNode>> = [],
        options: { level: number } = { level: 0 }
    ) {
        const { level } = options;
        list.forEach((item) => {
            if (!cache[level]) {
                // eslint-disable-next-line no-param-reassign
                cache[level] = [];
            }
            treeNode.setLevel(item, level);
            cache[level].push(item);
            if (treeNode.hasChildren(item)) {
                const childLevel = level + 1;
                this.cacheLevels(
                    treeNode.getChildren(item),
                    cache,
                    { level: childLevel }
                );
            } else {
                this.lastLevel.push(item);
            }
        });
        return cache;
    }

    /**
     * Fill horizontal grid map according to tree structure
     *
     * @param {Array<TreeNode>} children - list of tree nodes
     * @param {number} rows - deep level rows
     * @param {Object} map - map object to fill
     * @param {{parentColIndex: number, prevChildren: number}} initState - state object for
     * recursive calls
     * @returns {Object} - map object
     * @private
     */
    fillMap(
        children: Array<TreeNode>,
        rows: number,
        map: TreeCellMapCache = {},
        initState?: FillMapState
    ) {
        const state = initState || {
            parentRowIndex: 0,
            parentColIndex: 0,
            prevChildren: 0,
            parentKey: '',
        };
        const childCount = children.length;
        children.forEach((item: TreeNode, colIndex: number) => {
            const {
                parentRowIndex,
                parentColIndex,
                prevChildren,
                parentKey,
            } = state;
            const rowIndex = treeNode.getLevel(item);
            const rowStart = rowIndex + parentRowIndex;
            const colStart = colIndex + parentColIndex + prevChildren;
            const mainKey = keyCreator(rowStart, colStart);
            const mapMainItem = this.createTreeCellMap({
                rowIndex: rowStart,
                colIndex: colStart,
                node: item,
                parent: parentKey,
            });
            mapMainItem.setIndexInParent(colIndex, childCount);
            map[mainKey] = mapMainItem;
            let col = 0;
            let row = 0;
            if (treeNode.hasChildren(item)) {
                col = this.getTreeChildLength(item);
                if (typeof item.minLevel === 'number') {
                    // min level in case values offset
                    row = ((item.minLevel + 1) - rowStart || 0);
                }
            } else {
                row = (rows || 0) - (rowStart || 0);
            }
            if (col > 1 || row > 1) {
                // if has merged cells
                this.fillChildMap(map, mainKey, rowStart, colStart, row, col);
            }
            if (treeNode.hasChildren(item)) {
                const childState = {
                    ...state,
                    parentRowIndex: (row > 1 ? row - 1 : 0),
                    parentColIndex: colIndex + parentColIndex,
                    parentKey: mainKey,
                };
                this.fillMap(treeNode.getChildren(item), rows, map, childState);
                if (col > 1) {
                    state.prevChildren += col - 1;
                }
            }
        });
        return map;
    }

    /**
     * Fill vertical grid map according to tree structure
     *
     * @param {Array<TreeNode>} children - list of tree nodes
     * @param {number} cols - deep level columns
     * @param {TreeCellMapCache} map - map object to fill
     * @param {FillMapState} initState - state object for
     * recursive calls
     * @returns {Object} - map object
     * @private
     */
    fillMapVertical(
        children: Array<TreeNode>,
        cols: number,
        map: TreeCellMapCache = {},
        initState?: FillMapState
    ) {
        const state = initState || {
            parentRowIndex: 0,
            parentColIndex: 0,
            prevChildren: 0,
            parentKey: '',
        };
        const childCount = children.length;
        children.forEach((item: TreeNode, rowIndex: number) => {
            if (item.isMapped) {
                state.parentRowIndex += treeNode.getChildLength(item) - 1;
                return;
            }
            item.isMapped = true;
            const { parentRowIndex, prevChildren, parentKey } = state;
            const colIndex = treeNode.getLevel(item);
            const rowStart = rowIndex + parentRowIndex + prevChildren;
            const mainKey = keyCreator(rowStart, colIndex);
            const mapMainItem = this.createTreeCellMap({
                rowIndex: rowStart,
                colIndex,
                node: item,
                parent: parentKey,
            });
            mapMainItem.setIndexInParent(rowIndex, childCount);
            map[mainKey] = mapMainItem;
            let col = 0;
            let row = 0;
            if (treeNode.hasChildren(item)) {
                row = this.getTreeChildLength(item);
            } else {
                col = (cols || 0) - (colIndex || 0);
            }
            if (col > 1 || row > 1) {
                // if has merged cells
                this.fillChildMap(map, mainKey, rowStart, colIndex, row, col);
            }
            if (treeNode.hasChildren(item)) {
                const childState = {
                    ...state,
                    parentRowIndex: rowIndex + parentRowIndex,
                    parentKey: mainKey,
                };
                this.fillMapVertical(treeNode.getChildren(item), cols, map, childState);
                if (row > 1) {
                    state.prevChildren += row - 1;
                }
            }
        });

        return map;
    }

    /**
     * Fill child items in map according to main cell merged row and col
     *
     * @param {Object} map - map object to fill
     * @param {string} mainKey - main cell key in map
     * @param {number} rowStart - main cell row index
     * @param {number} colStart - main cell column index
     * @param {number} row - merged rows count
     * @param {number} col - merged columns count
     * @returns {void}
     * @private
     */
    fillChildMap(
        map: TreeCellMapCache,
        mainKey: string,
        rowStart: number,
        colStart: number,
        row: number,
        col: number
    ) {
        const mapMainItem = map[mainKey];
        const rowsCount = Math.max(1, row);
        const colsCount = Math.max(1, col);
        Array.from(Array(rowsCount)).forEach((r, rowAddIndex) => {
            Array.from(Array(colsCount)).forEach((c, colAddIndex) => {
                if (rowAddIndex === 0 && colAddIndex === 0) {
                    // skip main item
                    return;
                }
                const childRowIndex = rowStart + rowAddIndex;
                const childColIndex = colStart + colAddIndex;
                const childKey = keyCreator(childRowIndex, childColIndex);
                const childColItem = this.createTreeCellMap({
                    rowIndex: childRowIndex,
                    colIndex: childColIndex,
                    parent: mainKey,
                });
                map[childKey] = childColItem;

                if (rowAddIndex !== 0 && colAddIndex !== 0) {
                    // skip middle items
                    return;
                }

                if (colAddIndex === 0) {
                    mapMainItem.addRowCell(childColItem);
                }
                if (rowAddIndex === 0) {
                    mapMainItem.addColCell(childColItem);
                }
            });
        });
    }

    /**
     * Creates TreeCellMap instance
     *
     * @param {number} rowIndex - row index of cell map instance
     * @param {number} colIndex - row index of cell map instance
     * @param {TreeNode} [node] - TreeNode for main cell
     * @param {string} [parent] - parent key for child item
     * @returns {TreeCellMap} - TreeCellMap instance
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    createTreeCellMap({
        rowIndex,
        colIndex,
        node,
        parent,
    }: {
        rowIndex: number,
        colIndex: number,
        node?: TreeNode,
        parent?: string,
    }): TreeCellMapI {
        return new TreeCellMap(rowIndex, colIndex, node, parent);
    }

    /**
     * Returns TreeCellMapI item by key string
     *
     * @param {string} key - map key string
     * @returns {TreeCellMapI|null} - TreeCellMapI instance or null
     * @private
     */
    getItemByKey(key: string): TreeCellMapI | undefined {
        return this.map[key];
    }

    /**
     * Returns TreeCellMapI item by (row, col) coordinate
     *
     * @param {number} row - cell row index
     * @param {number} col - cell column index
     * @returns {TreeCellMapI|null} - TreeCellMapI instance or null
     * @private
     */
    getItem(row: number, col: number): TreeCellMapI | undefined {
        const key = keyCreator(row, col);
        return this.getItemByKey(key);
    }
}

export default AbstractTreeService;
