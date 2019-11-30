
/**
 * @interface
 */
export type TreeNode = {
    // raw data
    value?: string,
    // matched index for condition formatting
    cf?: number,
    // children nodes list
    children?: Array<TreeNode>,
    // data list for rows nodes
    data?: Array<any>,
    // index in data list for columns nodes
    index?: number,
    // current node's index divergence
    indexDivergence?: number,
    // initial children count in raw data from server
    size?: number,
    // defines is node is some part of real node
    isPart?: boolean,
    // node deep level
    level?: number,
    // node min deep level, for columns nodes with values at the and
    minLevel?: number,
    // internal cache, to make sure that node was already mapped
    isMapped?: boolean,
    // internal cache, for children count
    childCount?: number,
    // internal cache, for children deep
    childDeep?: number,
}

export type TreeNodeMetadata = {
    levels: Array<string>,
    siblings: Array<string>,
    root?: TreeNodeMetadata,
    parent?: TreeNodeMetadata,
    valueNode?: TreeNode,
};

export interface TreeCellMapI {
    rowIndex: number,
    colIndex: number,
    node?: TreeNode,
    parent?: string,
    isChild(): boolean,
    hasChildren(): boolean,
    hasColCell(): boolean,
    addColCell(cell: TreeCellMapI): void,
    getColCell(): Array<TreeCellMapI>,
    hasRowCell(): boolean,
    addRowCell(cell: TreeCellMapI): void,
    getRowCell(): Array<TreeCellMapI>,
    getStopRowIndex(): number,
    getStopColIndex(): number,
    setIndexInParent(indexInParent: number, siblingCount: number): void,
    getIndexInParent(): { indexInParent: number, siblingCount: number },
    getParenPosition(): Array<number> | undefined,
}
