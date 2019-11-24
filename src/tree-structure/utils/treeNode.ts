import { cloneObject } from '../../utils';
import { TreeNode } from '../types';

class ChunksList<T> extends Array<T> {
    isHandled?: boolean;

    constructor(items?: Array<T>) {
        super(...items);
        Object.setPrototypeOf(this, Object.create(ChunksList.prototype));
        this.isHandled = false;
    }
}

type ChunkState = { isFinished: boolean, hasReachedFirstCutNode: boolean };

type MyIterator = (value: TreeNode, key: number, array: ChunksList<TreeNode>) => void;

export const ROOT = '$*$root$*$';

export function create(
    value?: string,
    children?: Array<TreeNode>,
    data?: Array<any>,
    index?: number
): TreeNode {
    const res: TreeNode = { value };
    if (children) {
        res.children = children;
    }
    if (data) {
        res.data = data;
    }
    if (typeof index !== 'undefined') {
        res.index = index;
    }
    return res;
}

/**
 * Defines if node has child nodes or not
 *
 * @param {TreeNode} node - tree node object
 * @returns {boolean} - true - has children, false - last child
 */
export function hasChildren(node?: TreeNode): boolean {
    return !!(node && node.children && node.children.length);
}

/**
 * Returns list of child nodes
 *
 * @param {TreeNode} node - tree node object
 * @returns {Array<TreeNode>|Array} - list of child nodes or empty array
 */
export function getChildren(node?: TreeNode): Array<TreeNode> {
    return (node && node.children) || [];
}

/**
 * Set new list of child nodes
 *
 * @param {TreeNode} node - tree node object
 * @param {Array<TreeNode>} list - new list of child nodes
 * @returns {void}
 */
export function setChildren(node?: TreeNode, list?: Array<TreeNode>): void {
    if (node && list && Array.isArray(list)) {
        node.children = list;
    }
}

/**
 * Set node deep level in tree hierarchy
 *
 * @param {TreeNode} node - tree node object
 * @param {number} level - hierarchy level
 * @returns {void}
 */
export function setLevel(node: TreeNode | undefined, level: number): void {
    if (node) {
        node.level = level;
    }
}

/**
 * Returns node deep level in tree hierarchy
 *
 * @param {TreeNode} node - tree node object
 * @returns {number} hierarchy level
 */
export function getLevel(node?: TreeNode): number {
    if (node && typeof node.level !== 'undefined') {
        return node.level || 0;
    }
    return -1;
}

export function wrapInRootNode(data?: (TreeNode | Array<TreeNode>)): TreeNode | undefined {
    if (!data) {
        return undefined;
    }
    if (data && !Array.isArray(data) && data.value === ROOT) {
        return data;
    }
    const node: TreeNode = { value: ROOT, children: [] };
    if (Array.isArray(data)) {
        node.children = data;
    } else {
        (node.children || [])[0] = data;
    }
    return node;
}

function findNode(rootNode?: TreeNode, checkCb?: Function, level: number = 0): TreeNode | undefined {
    let res = undefined;
    if (!rootNode || !checkCb) {
        return res;
    }
    if (checkCb(rootNode, level)) {
        res = rootNode;
    }
    if (hasChildren(rootNode)) {
        const children = getChildren(rootNode);
        const childCount = children.length;
        for (let i = 0; i < childCount; i += 1) {
            const childRes = findNode(children[i], checkCb, level + 1);
            if (childRes) {
                res = childRes;
                break;
            }
        }
    }
    return res;
}

/**
 * Merge two root trees into one
 *
 * @param {TreeNode} [firstNode=null] - first tree
 * @param {TreeNode} [secondNode=null] - second tree
 * @returns {TreeNode} - merged tree
 */
export function merge(
    firstNode: TreeNode | undefined,
    secondNode: TreeNode | undefined
): TreeNode | undefined {
    if (!firstNode && !secondNode) {
        return undefined;
    } else if (!firstNode && secondNode) {
        return wrapInRootNode(secondNode);
    } else if (firstNode && !secondNode) {
        return wrapInRootNode(firstNode);
    }
    const firstRootNode = wrapInRootNode(firstNode);
    const secondRootNode = wrapInRootNode(secondNode);
    const firstChildrens = (firstRootNode && firstRootNode.children) || [];
    const secondChildrens = (secondRootNode && secondRootNode.children) || [];
    const children = firstChildrens.concat(secondChildrens);
    return wrapInRootNode(children);
}

const findLastCut = (node: TreeNode | undefined, level: number = 0): TreeNode | undefined => {
    if (!node || !node.isPart) {
        return undefined;
    }
    node.level = level;
    const childs = getChildren(node);
    const lastChild = childs[childs.length - 1];
    if (!lastChild) {
        return node;
    }
    const childCut = findLastCut(lastChild, level + 1);
    return childCut || node;
};

const findFirstCut = (
    node: TreeNode | undefined,
    lastCut: TreeNode| undefined,
    level: number = 0
): TreeNode | undefined => {
    if (!node || !node.isPart) {
        return undefined;
    }
    node.level = level;
    if (node && lastCut && node.value === lastCut.value && node.level === lastCut.level) {
        return node;
    }
    const childs = getChildren(node);
    const firstChild = childs[0];
    if (!firstChild) {
        return node;
    }
    const childCut = findFirstCut(firstChild, lastCut, level + 1);
    return childCut || node;
};

const moveUnbrokenNodes = (destList: ChunksList<TreeNode>, state: ChunkState): MyIterator => (
    (item: TreeNode, key: number) => {
        if (destList.isHandled) {
            return;
        }
        if (item.isPart && !state.hasReachedFirstCutNode && key === 0) {
            // skip
            // at index 0 is the first isPart group, that was merged previously
            // no need to skip the last isPart group in data chunk
            const isLastCut = !getChildren(item).some(child => (child.isPart));
            if (isLastCut) {
                state.hasReachedFirstCutNode = true;
            }
        } else {
            destList.push(item);
        }
    }
);

/**
 * Merge two partial nodes into one
 *
 * @param {TreeNode} chunkA - first chunk
 * @param {TreeNode} chunkB - second chunk
 * @returns {TreeNode} - final merged chunk
 */
export function deepMerge(chunkA: TreeNode | undefined, chunkB: TreeNode | undefined) {
    const lastCutNodeA = findLastCut(chunkA);
    const firstCutNodeB = findFirstCut(chunkB, lastCutNodeA);

    const child: ChunksList<TreeNode> = getChildren(lastCutNodeA).concat(getChildren(firstCutNodeB));
    setChildren(lastCutNodeA, child);
    // $FlowFixMe
    child.isHandled = true;
    const state: ChunkState = { isFinished: false, hasReachedFirstCutNode: false };
    let currentNodeA = chunkA;
    let currentNodeB = chunkB;
    while (!state.isFinished) {
        const currentChildsA: ChunksList<TreeNode> = getChildren(currentNodeA);
        const currentChildsB: ChunksList<TreeNode> = getChildren(currentNodeB);
        const lastChildsIndexA = currentChildsA.length - 1;
        const firstChildsIndexB = 0;
        currentNodeA = currentChildsA[lastChildsIndexA];
        currentNodeB = currentChildsB[firstChildsIndexB];
        if (currentChildsA.isHandled || currentChildsB.isHandled) {
            state.isFinished = true;
        } else {
            currentChildsB.forEach(moveUnbrokenNodes(currentChildsA, state));
            if (!currentNodeA && !currentNodeB) {
                state.isFinished = true;
            }
        }
    }

    return chunkA;
}

export function iterateThroughTree(
    nodes: Array<Object>,
    callback: (item: Object, parent?: Object) => void,
    parent?: Object
): void {
    nodes.forEach((node) => {
        callback(node, parent);
        if (hasChildren(node)) {
            iterateThroughTree(getChildren(node), callback, node);
        }
    });
}

export function getLastLevelNodes(
    nodes: Array<TreeNode>,
    lastLevelNodes: Array<TreeNode> = [],
    level: number = 0,
    options: { maxLevel: number } = { maxLevel: 0 }
): Array<TreeNode> {
    nodes.forEach((item) => {
        if (options.maxLevel < level) {
            options.maxLevel = level;
        }
        if (hasChildren(item)) {
            getLastLevelNodes(
                getChildren(item),
                lastLevelNodes,
                level + 1,
                options
            );
        } else {
            lastLevelNodes.push(item);
        }
    });
    return lastLevelNodes;
}

/**
 * Returns number of last children for the tree
 *
 * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
 * @param {Object} options - additional options
 * @param {number} options.callCount - inner state for recursive calls count
 * @param {boolean} options.clearCache - define if use cached value or recalculate new one
 * @returns {number} - count of last children
 */
export function getChildLength(
    item?: (TreeNode[] | TreeNode),
    options: { callCount?: number, clearCache?: boolean } = {}
): number {
    if (!options) {
        // eslint-disable-next-line no-param-reassign
        options = {};
    }
    if (typeof options.callCount !== 'number') {
        options.callCount = 1;
    } else {
        options.callCount += 1;
    }

    if (!item) {
        return 0;
    }

    let clearCache = options.clearCache || false;
    if (!Array.isArray(item) && item.value === ROOT) {
        // do not use cache from 'root' node
        clearCache = true;
    }

    let count = 1;
    let children: Array<TreeNode> = [];

    if (Array.isArray(item)) {
        count = 0;
        children = item;
    } else if (item.children) {
        children = getChildren(item);
    }

    if (children && children.length) {
        if (!clearCache && !Array.isArray(item) && typeof item.childCount === 'number') {
            // get cached value
            count = item.childCount;
        } else {
            count = 0;
            // recalculate new value
            children.forEach((child: Object) => {
                count += getChildLength(child, options);
            });
            if (!Array.isArray(item)) {
                // cache value
                item.childCount = count;
            }
        }
    }
    return count;
}

/**
 * Returns deep level of the tree
 *
 * @param {Array<TreeNode> | TreeNode} item - tree node or list of nodes
 * @param {Object} options - additional options
 * @param {number} options.callCount - inner state for recursive calls count
 * @param {boolean} options.clearCache - define if use cached value or recalculate new one
 * @returns {number} - count of last children
 */
export function getDeepLength(
    item?: (TreeNode[] | TreeNode),
    options: { callCount?: number, clearCache?: boolean } = {}
): number {
    if (!options) {
        // eslint-disable-next-line no-param-reassign
        options = {};
    }
    if (typeof options.callCount !== 'number') {
        options.callCount = 1;
    } else {
        options.callCount += 1;
    }

    if (!item) {
        return 0;
    }

    let clearCache = options.clearCache || false;
    if (!Array.isArray(item) && item.value === ROOT) {
        // do not use cache from 'root' node
        clearCache = true;
    }

    let count = 0;
    let children: Array<Object> = [];

    if (item && !Array.isArray(item) && typeof item.value !== 'undefined') {
        count = 1;
    }

    if (Array.isArray(item)) {
        count = 0;
        children = item;
    } else if (item.children) {
        children = getChildren(item);
    }

    if (children && children.length) {
        if (!clearCache && !Array.isArray(item) && typeof item.childDeep === 'number') {
            // get cached value
            count += item.childDeep;
        } else {
            let maxCount = 0;
            children.forEach((child: Object) => {
                const childCount = getDeepLength(child, options);
                if (childCount > maxCount) {
                    maxCount = childCount;
                }
            });
            count += maxCount;
            if (!Array.isArray(item)) {
                // cache value
                item.childDeep = maxCount;
            }
        }
    }
    return count;
}

/**
 * Returns part of tree nodes list according to children indexes "from" - "to"
 *
 * @param {Array<TreeNode>} rootNodes - list of nodes
 * @param {number} [from=0] - start index to for partial tree
 * @param {number} [to] - end index for partial tree
 * @returns {{nodes: Array<TreeNode>, start: number, stop: number}} - partial tree nodes and
 * start/stop indexes of it in scope of initial list
 */
export function getNodesByChildCount(
    rootNodes: Array<TreeNode> = [],
    from: number = 0,
    to?: number
): { nodes: Array<TreeNode>, start: number, stop: number } {
    const nodes = [];
    let index = 0;
    let startIndex = -1;
    let stopIndex = -1;
    const count = rootNodes.length;
    if (typeof from === 'number' && typeof to === 'number' && from > to) {
        throw new Error('Wrong "getNodesByChildCount" diapason');
    }
    if (typeof from === 'number' && from < 0) {
        throw new Error('Wrong "from" index for "getNodesByChildCount"');
    }

    for (let i = 0; i < count; i += 1) {
        const rootNode = rootNodes[i];
        const childCount = getChildLength(rootNode);
        // start index
        if (index + childCount > from) {
            if (startIndex < 0) {
                startIndex = index;
            }
            nodes.push(rootNode);
            // stop index
            if (typeof to === 'number' && index + childCount >= to) {
                stopIndex = index + childCount;
                break;
            }
        }
        stopIndex = index + childCount;
        index += childCount;
    }
    return {
        nodes,
        start: startIndex,
        stop: stopIndex,
    };
}

/**
 * Returns cut cloned part of tree nodes list according to children indexes "from" - "to"
 *
 * @param {Array<TreeNode>} rootNodes - list of nodes
 * @param {number} [from=0] - start index to for cut tree
 * @param {number} [to] - end index for cut tree
 * @param {Object} [options] - additional options
 * @param {Array<string>} [options.cloneInclude] - clone node include keys
 * @param {Array<string>} [options.cloneExclude] - clone node exclude keys
 * @returns {Array<TreeNode>} - cut cloned list of nodes
 */
export function getCutNodesByChildCount(
    rootNodes: Array<TreeNode> = [],
    from: number = 0,
    to?: number,
    options?: { cloneInclude?: Array<string>, cloneExclude?: Array<string> }
): Array<TreeNode> {
    const { cloneInclude, cloneExclude = [] } = options || {};
    const defaultExclude = ['isMapped', 'minLevel', 'childCount', 'childDeep'];
    const result: Array<TreeNode> = [];
    const { nodes, start, stop } = getNodesByChildCount(rootNodes, from, to);
    const count = nodes.length;

    let firstItem: TreeNode;
    let lastItem: TreeNode;
    let handleLast = true;

    if (start < from) {
        const firstOriginalItem = nodes[0] || {};
        const newFrom = from - start;
        let newTo;

        if (count === 1 && typeof to === 'number') {
            newTo = to - start;
            handleLast = false;
        }
        firstItem = cloneObject(
            firstOriginalItem,
            { include: cloneInclude, exclude: cloneExclude }
        );
        const firstItemChilds = getCutNodesByChildCount(
            getChildren(firstOriginalItem),
            newFrom,
            newTo,
            { cloneExclude: ['children', ...defaultExclude] }
        );
        setChildren(firstItem, firstItemChilds);
    }

    if (typeof to === 'number' && stop > to && handleLast) {
        const lastOriginalItem = nodes[count - 1] || {};
        const newFrom = 0;
        const newTo = getChildLength(lastOriginalItem) - (stop - to);

        lastItem = cloneObject(
            lastOriginalItem,
            { include: cloneInclude, exclude: cloneExclude }
        );

        const lastItemChilds = getCutNodesByChildCount(
            getChildren(lastOriginalItem),
            newFrom,
            newTo,
            { cloneExclude: ['children', ...defaultExclude] }
        );
        setChildren(lastItem, lastItemChilds);
    }

    nodes.forEach((node, index) => {
        if (firstItem && index === 0) {
            result.push(firstItem);
        } else if (lastItem && index === count - 1) {
            result.push(lastItem);
        } else {
            const clonedNode = cloneObject(node, { exclude: defaultExclude });
            result.push(clonedNode);
        }
    });

    return result;
}

export default {
    ROOT,
    create,
    hasChildren,
    getChildren,
    setChildren,
    setLevel,
    getLevel,
    getLastLevelNodes,
    iterateThroughTree,
    wrapInRootNode,
    findNode,
    merge,
    deepMerge,
    getChildLength,
    getDeepLength,
    getNodesByChildCount,
    getCutNodesByChildCount,
};
