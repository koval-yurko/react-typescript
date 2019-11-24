import { AbstractTreeService } from './AbstractTreeService';
import { treeNode } from './utils/index';
// import { keyCreator } from '../components/TableGrid/utils/index';
import { TreeNode, TreeServiceI, TreeNodeMetadata, TreeCellMapI } from './types';

type TreeCellMapCache = {
    [key: string]: TreeCellMapI,
}

type FillMapState = {
    parentRowIndex: number,
    prevChildren: number,
    parentKey: string,
};

// const keyCreator = (rowIndex: number, columnIndex: number): string => (
//     `${rowIndex}-${columnIndex}`
// );

/**
 * Projection on main TreeService with custom paginated map data tree from "from" to "to" as pages.
 */
export class PaginatedPartialTreeService extends AbstractTreeService {
    from: number;

    to: number;

    constructor(
        tree?: TreeNode,
        isVertical = false,
        deep?: number,
        from = 0,
        to = Infinity
    ) {
        super(tree, isVertical, deep);
        this.from = from;
        this.to = to;
    }

    /**
     * Returns grid (2d list) of tree structure
     *
     * @returns {Array<Array<TreeNode | string>>} - 2d list
     */
    getGrid(): Array<Array<TreeNode | string>> {
        if (!this.isVertical) {
            throw new Error('"getPaginatedGrid" can only be used for "vertical" tree');
        }
        if (!this.grid) {
            const { from, to } = this;
            const cols = this.getTreeDeepsLength();

            const treeChild = treeNode.getChildren(this.tree);
            const { nodes, start, stop } = treeNode.getNodesByChildCount(treeChild, from, to);

            this.map = this.fillMapVertical(nodes, cols, this.map, {
                parentRowIndex: start,
                prevChildren: 0,
                parentKey: '',
            }, { from, to });

            const finalTo = Math.min(stop, to);
            const finalCount = Math.max(0, finalTo - from);
            this.grid = Array.from(Array(finalCount)).map((rO, rowIndex) => (
                Array.from(Array(cols)).map((cO, colIndex) => {
                    const key = keyCreator(rowIndex, colIndex);
                    const mapItem = this.map[key];
                    if (!mapItem) {
                        throw new Error(`Key "${key}" does not found in TreeService`);
                    }
                    return mapItem.node ? mapItem.node : mapItem.parent;
                })
            ));
        }

        return this.grid;
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
        options?: { from: number; to: number }
    ): TreeNodeMetadata | undefined {
        const newOptions = {
            ...options,
            from: this.from,
            to: this.to,
        };
        return super.getMetadata(rowIndex, columnIndex, newOptions);
    }

    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PartialTreeService} - - new TreeService
     */
    createPartialTreeService(from: number, to: number): TreeServiceI {
        throw new Error('Should not be used in PaginatedPartialTreeService');
        // $FlowFixMe
        console.error(from, to, this); // eslint-disable-line no-console, no-unreachable
    }

    /**
     * Creates partial TreeService based on current one with partial rows "from" - "to"
     *
     * @param {number} from - start rows index for partial TreeService
     * @param {number} to - stop rows index for partial TreeService
     * @returns {PartialTreeService} - - new TreeService
     */
    createPaginatedPartialTreeService(from: number, to: number): TreeServiceI {
        throw new Error('Should not be used in PaginatedPartialTreeService');
        // $FlowFixMe
        console.error(from, to, this); // eslint-disable-line no-console, no-unreachable
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
     * Returns array of last tree nodes
     *
     * @returns {Array<TreeNode>} - list of tree nodes
     */
    getLastLevelNodes(): Array<TreeNode> {
        const parentLastLevel = AbstractTreeService
            .prototype
            .getLastLevelNodes.call(this);
        return parentLastLevel.slice(this.from, this.to);
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
     * Align stop index in case of long merged cell
     *
     * @param {number} stopIndex - initial stop index
     * @param {boolean} isVertical - defines if it is vertical grid or not
     * @returns {number} - new stop index
     */
    alignStopIndex(stopIndex: number, isVertical?: boolean): number {
        const stop = AbstractTreeService
            .prototype
            .alignStopIndex.call(this, stopIndex, isVertical);
        return Math.min(this.to - 1, stop);
    }

    /**
     * Sets value node when it's single
     *
     * @param {TreeNode} valueNode - values measure node
     * @returns {void}
     */
    setValueNode(valueNode: TreeNode): void {
        throw new Error('Should not be used in PaginatedPartialTreeService');
        // $FlowFixMe
        console.error(valueNode, this); // eslint-disable-line no-console, no-unreachable
    }
    /**
     * Returns part of current grid according to "from" - "to" position
     *
     * @param {number} from - start rows index for partial grid
     * @param {number} to - stop rows index for partial grid
     * @returns {Array<Array<TreeNode | string>>} - partial grid
     */
    getPartialGrid(from: number, to: number): Array<Array<TreeNode | string>> {
        throw new Error('Should not be used in PaginatedPartialTreeService');
        // $FlowFixMe
        console.error(from, to, this); // eslint-disable-line no-console, no-unreachable
    }

    /**
     * Adds additional tree node to current state
     *
     * @param {TreeNode} tree - new treeNode
     * @returns {void}
     */
    extend(tree?: TreeNode): void {
        throw new Error('Should not be used in PaginatedPartialTreeService');
        // $FlowFixMe
        console.error(tree, this); // eslint-disable-line no-console, no-unreachable
    }

    /**
     * Fill vertical grid map according to tree structure
     *
     * @param {Array<TreeNode>} children - list of tree nodes
     * @param {number} cols - deep level columns
     * @param {Object} map - map object to fill
     * @param {{parentRowIndex: number, prevChildren: number}} initState - state object for
     * recursive calls
     * @param {{from: number, to: number}} limiters - limiters for paginated cell mapping
     * @returns {Object} - map object
     * @private
     */
    fillMapVertical(
        children: Array<TreeNode>,
        cols: number,
        map: TreeCellMapCache = {},
        initState?: FillMapState,
        limiters: {
            from: number,
            to: number,
        } = { from: 0, to: Infinity }
    ) {
        const state = initState || {
            parentRowIndex: 0,
            prevChildren: 0,
            parentKey: '',
        };
        const {
            from,
            to,
        } = limiters;
        const childCount = children.length;
        children.forEach((item: TreeNode, rowIndex: number) => {
            const { parentRowIndex, prevChildren, parentKey } = state;
            const colIndex = treeNode.getLevel(item);
            let rowStart = rowIndex + parentRowIndex + prevChildren;
            const childLength = treeNode.getChildLength(item);
            let rowStop = (rowStart - 1) + childLength;
            if (rowStop < from || to < rowStart) {
                if (childLength > 0) {
                    state.prevChildren += childLength - 1;
                }
                return;
            } else if (rowStart <= from && from <= rowStop) {
                rowStart = from;
            } else if (rowStart < to && to < rowStop) {
                rowStop = to;
            }
            const mainKey = keyCreator(rowStart - from, colIndex);

            const mapMainItem = this.createTreeCellMap({
                rowIndex: rowStart - from,
                colIndex,
                node: item,
                parent: parentKey,
            });
            mapMainItem.setIndexInParent(rowIndex, childCount);
            map[mainKey] = mapMainItem;
            let col = 0;
            let row = 0;
            if (treeNode.hasChildren(item)) {
                row = (rowStop + 1) - rowStart;
            } else {
                col = (cols || 0) - (colIndex || 0);
            }
            if (col > 1 || row > 1) {
                // if has merged cells
                this.fillChildMap(map, mainKey, rowStart - from, colIndex, row, col);
            }
            if (treeNode.hasChildren(item)) {
                const childState = {
                    ...state,
                    parentRowIndex: rowIndex + parentRowIndex,
                    parentKey: mainKey,
                };
                this.fillMapVertical(treeNode.getChildren(item), cols, map, childState, limiters);
                if (childLength > 0) {
                    state.prevChildren += childLength - 1;
                }
            }
        });

        return map;
    }
}

export default PaginatedPartialTreeService;
