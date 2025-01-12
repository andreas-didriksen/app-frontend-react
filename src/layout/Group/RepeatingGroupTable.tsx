import React from 'react';

import { Table, TableBody, TableCell, TableHeader, TableRow } from '@digdir/design-system-react';
import cn from 'classnames';

import { useIsMobileOrTablet } from 'src/hooks/useIsMobile';
import { useLanguage } from 'src/hooks/useLanguage';
import { CompCategory } from 'src/layout/common';
import { GenericComponent } from 'src/layout/GenericComponent';
import { GridRowRenderer } from 'src/layout/Grid/GridComponent';
import { nodesFromGridRows } from 'src/layout/Grid/tools';
import classes from 'src/layout/Group/RepeatingGroup.module.css';
import { RepeatingGroupsEditContainer } from 'src/layout/Group/RepeatingGroupsEditContainer';
import { RepeatingGroupTableRow } from 'src/layout/Group/RepeatingGroupTableRow';
import { RepeatingGroupTableTitle } from 'src/layout/Group/RepeatingGroupTableTitle';
import { getColumnStylesRepeatingGroups } from 'src/utils/formComponentUtils';
import type { GridRowsInternal, ITableColumnFormatting } from 'src/layout/common.generated';
import type { CompGroupRepeatingInternal } from 'src/layout/Group/config.generated';
import type { LayoutNodeForGroup } from 'src/layout/Group/LayoutNodeForGroup';

export interface IRepeatingGroupTableProps {
  node: LayoutNodeForGroup<CompGroupRepeatingInternal>;
  repeatingGroupIndex: number;
  editIndex: number;
  setEditIndex: (index: number, forceValidation?: boolean) => void;
  onClickRemove: (groupIndex: number) => void;
  setMultiPageIndex?: (index: number) => void;
  multiPageIndex?: number;
  deleting: boolean;
  filteredIndexes?: number[] | null;
  rowsBefore?: GridRowsInternal;
  rowsAfter?: GridRowsInternal;
}

export function RepeatingGroupTable({
  node,
  repeatingGroupIndex,
  editIndex,
  setEditIndex,
  onClickRemove,
  setMultiPageIndex,
  multiPageIndex,
  deleting,
  filteredIndexes,
  rowsBefore,
  rowsAfter,
}: IRepeatingGroupTableProps): JSX.Element | null {
  const mobileView = useIsMobileOrTablet();
  const { lang } = useLanguage();

  const id = node.item.id;
  const container = node.item;
  const edit = container.edit;
  const columnSettings = container.tableColumns
    ? structuredClone(container.tableColumns)
    : ({} as ITableColumnFormatting);

  const getTableNodes = (rowIndex: number) => {
    const tableHeaders = container?.tableHeaders;
    const nodes = node.children(undefined, rowIndex).filter((child) => {
      if (tableHeaders) {
        const { id, baseComponentId } = child.item;
        return !!(tableHeaders.includes(id) || (baseComponentId && tableHeaders.includes(baseComponentId)));
      }
      return child.isCategory(CompCategory.Form);
    });

    // Sort using the order from tableHeaders
    if (tableHeaders) {
      nodes?.sort((a, b) => {
        const aIndex = tableHeaders.indexOf(a.item.baseComponentId || a.item.id);
        const bIndex = tableHeaders.indexOf(b.item.baseComponentId || b.item.id);
        return aIndex - bIndex;
      });
    }

    return nodes;
  };

  const tableNodes = getTableNodes(0);

  // Values adjusted for filter
  const numRows = filteredIndexes ? filteredIndexes.length : repeatingGroupIndex + 1;
  const editRowIndex = filteredIndexes ? filteredIndexes.indexOf(editIndex) : editIndex;

  const isEmpty = numRows === 0;
  const showTableHeader = numRows > 0 && !(numRows == 1 && editRowIndex == 0);

  const showDeleteButtonColumns = new Set<boolean>();
  const showEditButtonColumns = new Set<boolean>();
  for (const row of node.item.rows) {
    showDeleteButtonColumns.add(row?.groupExpressions?.edit?.deleteButton !== false);
    showEditButtonColumns.add(row?.groupExpressions?.edit?.editButton !== false);
  }
  let displayDeleteColumn = showDeleteButtonColumns.has(true) || !showDeleteButtonColumns.has(false);
  let displayEditColumn = showEditButtonColumns.has(true) || !showEditButtonColumns.has(false);
  if (edit?.editButton === false) {
    displayEditColumn = false;
  }
  if (edit?.deleteButton === false) {
    displayDeleteColumn = false;
  }
  if (edit?.mode === 'onlyTable') {
    displayEditColumn = false;
  }

  const isNested = typeof container?.baseComponentId === 'string';

  const handleDeleteClick = (index: number) => {
    onClickRemove(index);
  };

  const handleEditClick = (groupIndex: number) => {
    if (groupIndex === editIndex) {
      setEditIndex(-1);
    } else {
      setEditIndex(groupIndex);
    }
  };

  const renderRepeatingGroupsEditContainer = () =>
    editIndex >= 0 &&
    edit?.mode !== 'onlyTable' && (
      <RepeatingGroupsEditContainer
        node={node}
        editIndex={editIndex}
        setEditIndex={setEditIndex}
        multiPageIndex={multiPageIndex}
        setMultiPageIndex={setMultiPageIndex}
        filteredIndexes={filteredIndexes}
      />
    );

  if (!tableNodes) {
    return null;
  }

  const extraCells = [...(displayEditColumn ? [null] : []), ...(displayDeleteColumn ? [null] : [])];

  function RenderExtraRows({ rows, where }: { rows: GridRowsInternal | undefined; where: 'Before' | 'After' }) {
    if (isEmpty || !rows) {
      return null;
    }

    if (mobileView) {
      const nodes = nodesFromGridRows(rows).filter((child) => !child.isHidden());
      if (!nodes) {
        return null;
      }

      return (
        <TableBody>
          <TableRow>
            <TableCell className={classes.mobileTableCell}>
              {nodes.map((child) => (
                <GenericComponent
                  key={child.item.id}
                  node={child}
                />
              ))}
            </TableCell>
            {/* One extra cell to make place for edit/delete buttons */}
            <TableCell className={classes.mobileTableCell} />
          </TableRow>
        </TableBody>
      );
    }

    return (
      <>
        {rows.map((row, index) => (
          <GridRowRenderer
            key={`grid${where}-${index}`}
            row={{ ...row, cells: [...row.cells, ...extraCells] }}
            isNested={isNested}
            mutableColumnSettings={columnSettings}
            node={node}
          />
        ))}
      </>
    );
  }

  return (
    <div
      data-testid={`group-${id}`}
      id={`group-${id}`}
      className={cn({
        [classes.groupContainer]: !isNested,
        [classes.nestedGroupContainer]: isNested,
        [classes.tableEmpty]: isEmpty,
      })}
    >
      <Table
        id={`group-${id}-table`}
        className={cn({ [classes.editingBorder]: isNested }, classes.repeatingGroupTable)}
      >
        <RenderExtraRows
          rows={rowsBefore}
          where={'Before'}
        />
        {showTableHeader && !mobileView && (
          <TableHeader id={`group-${id}-table-header`}>
            <TableRow className={classes.repeatingGroupRow}>
              {tableNodes?.map((n) => (
                <TableCell
                  key={n.item.id}
                  className={classes.tableCellFormatting}
                  style={getColumnStylesRepeatingGroups(n, columnSettings)}
                >
                  <RepeatingGroupTableTitle
                    node={n}
                    columnSettings={columnSettings}
                  />
                </TableCell>
              ))}
              {displayEditColumn && (
                <TableCell style={{ padding: 0, paddingRight: '10px' }}>
                  <span className={classes.visuallyHidden}>{lang('general.edit')}</span>
                </TableCell>
              )}
              {displayDeleteColumn && (
                <TableCell style={{ padding: 0 }}>
                  <span className={classes.visuallyHidden}>{lang('general.delete')}</span>
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
        )}
        <TableBody id={`group-${id}-table-body`}>
          {repeatingGroupIndex >= 0 &&
            [...Array(repeatingGroupIndex + 1)].map((_x: any, index: number) => {
              const children = node.children(undefined, index);
              const rowHasErrors = !!children.find((c) => c.hasValidationMessages());

              // Check if filter is applied and includes specified index.
              if (filteredIndexes && !filteredIndexes.includes(index)) {
                return null;
              }

              const isTableRowHidden =
                node.item.type === 'Group' && 'rows' in node.item && node.item.rows[index]?.groupExpressions?.hiddenRow;

              if (isTableRowHidden) {
                return null;
              }

              const isEditingRow = index === editIndex && edit?.mode !== 'onlyTable';

              return (
                <React.Fragment key={index}>
                  <RepeatingGroupTableRow
                    node={node}
                    className={cn({
                      [classes.editingRow]: isEditingRow,
                    })}
                    editIndex={editIndex}
                    setEditIndex={setEditIndex}
                    onClickRemove={onClickRemove}
                    deleting={deleting}
                    index={index}
                    rowHasErrors={rowHasErrors}
                    getTableNodes={getTableNodes}
                    onEditClick={() => handleEditClick(index)}
                    onDeleteClick={() => handleDeleteClick(index)}
                    mobileView={mobileView}
                    displayDeleteColumn={displayDeleteColumn}
                    displayEditColumn={displayEditColumn}
                  />
                  {isEditingRow && (
                    <TableRow
                      key={`edit-container-${index}`}
                      className={classes.editContainerRow}
                    >
                      <TableCell
                        style={{ padding: 0, borderTop: 0 }}
                        colSpan={
                          mobileView
                            ? 2
                            : tableNodes.length + 3 + (displayEditColumn ? 1 : 0) + (displayDeleteColumn ? 1 : 0)
                        }
                      >
                        {renderRepeatingGroupsEditContainer()}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
        </TableBody>
        <RenderExtraRows
          rows={rowsAfter}
          where={'After'}
        />
      </Table>
    </div>
  );
}
