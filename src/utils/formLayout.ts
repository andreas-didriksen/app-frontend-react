import { groupIsRepeatingExt, groupIsRepeatingLikertExt } from 'src/layout/Group/tools';
import type { IFormData } from 'src/features/formData';
import type { ILayoutNavigation } from 'src/layout/common.generated';
import type { CompGroupExternal, IGroupEditPropertiesInternal, IGroupFilter } from 'src/layout/Group/config.generated';
import type { CompExternal, ILayout } from 'src/layout/layout';
import type { ILayoutSets, IRepeatingGroups } from 'src/types';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPage } from 'src/utils/layout/LayoutPage';

interface SplitKey {
  baseComponentId: string;
  stringDepth: string;
  stringDepthWithLeadingDash: string;
  depth: number[];
}

/**
 * Takes a dashed component id (possibly inside a repeating group row), like 'myComponent-0-1' and returns
 * a workable object:
 *   {
 *     baseComponentId: 'myComponent',
 *     stringDepth: '0-1',
 *     stringDepthWithLeadingDash: '-0-1',
 *     depth: [0, 1],
 *   }
 */
export function splitDashedKey(componentId: string): SplitKey {
  const parts = componentId.split('-');

  const depth: number[] = [];
  while (parts.length) {
    const toConsider = parts.pop();

    // Since our form component IDs are usually UUIDs, they will contain hyphens and may even end in '-<number>'.
    // We'll assume the application has less than 5-digit repeating group elements (the last leg of UUIDs are always
    // longer than 5 digits).
    if (toConsider?.match(/^\d{1,5}$/)) {
      depth.push(parseInt(toConsider, 10));
    } else {
      depth.reverse();
      const stringDepth = depth.join('-').toString();
      return {
        baseComponentId: [...parts, toConsider].join('-'),
        stringDepth,
        stringDepthWithLeadingDash: stringDepth ? `-${stringDepth}` : '',
        depth,
      };
    }
  }

  return {
    baseComponentId: componentId,
    stringDepth: '',
    stringDepthWithLeadingDash: '',
    depth: [],
  };
}

const getMaxIndexInKeys = (keys: string[], nested = false) => {
  const arrayIndexRegex = new RegExp(/\[(\d+)]/);
  const nestedArrayIndexRegex = new RegExp(/^.+?\[(\d+)].+?\[(\d+)]/);
  return Math.max(
    ...keys.map((formDataKey) => {
      const match = formDataKey.match(nested ? nestedArrayIndexRegex : arrayIndexRegex);
      const indexAsString = match && match[nested ? 2 : 1];
      if (indexAsString) {
        return parseInt(indexAsString, 10);
      }
      return -1;
    }),
  );
};

/**
 * @deprecated Note: This functionality may not be present in the layout hierarchy, but prefer implementing it there
 *   over continued usage of this functionality.
 * @see useExprContext
 * @see useResolvedNode
 */
export function getRepeatingGroups(formLayout: ILayout, formData: any) {
  const repeatingGroups: IRepeatingGroups = {};

  const groups = formLayout.filter((layoutElement) => layoutElement.type === 'Group');

  const childGroups: string[] = [];
  groups.forEach((group: CompGroupExternal) => {
    group.children?.forEach((childId: string) => {
      formLayout
        .filter((element) => {
          if (element.type !== 'Group') {
            return false;
          }
          if (groupIsRepeatingExt(group) && group.edit?.multiPage) {
            return childId.split(':')[1] === element.id;
          }
          return element.id === childId;
        })
        .forEach((childGroup) => childGroups.push(childGroup.id));
    });
  });

  // filter away groups that should be rendered as child groups
  const filteredGroups = groups.filter((group) => childGroups.indexOf(group.id) === -1);

  filteredGroups.forEach((groupElement: CompGroupExternal) => {
    if (groupIsRepeatingExt(groupElement) || groupIsRepeatingLikertExt(groupElement)) {
      const groupFormData = Object.keys(formData)
        .filter((key) => groupElement.dataModelBindings?.group && key.startsWith(groupElement.dataModelBindings.group))
        .sort();
      if (groupFormData && groupFormData.length > 0) {
        const maxIndex = getMaxIndexInKeys(groupFormData);
        if (maxIndex !== -1) {
          const index = maxIndex;
          repeatingGroups[groupElement.id] = {
            index,
            dataModelBinding: groupElement.dataModelBindings?.group,
            editIndex: -1,
            multiPageIndex: -1,
          };
          const groupElementChildGroups: string[] = [];
          groupElement.children?.forEach((id) => {
            if (
              groupIsRepeatingExt(groupElement) &&
              groupElement.edit?.multiPage &&
              childGroups.includes(id.split(':')[1])
            ) {
              groupElementChildGroups.push(id.split(':')[1]);
            } else if (childGroups.includes(id)) {
              groupElementChildGroups.push(id);
            }
          });
          groupElementChildGroups.forEach((childGroupId: string) => {
            const childGroup = groups.find((element) => element.id === childGroupId) as CompGroupExternal;
            [...Array(index + 1)].forEach((_x: any, childGroupIndex: number) => {
              const groupId = `${childGroup?.id}-${childGroupIndex}`;
              repeatingGroups[groupId] = {
                index: getIndexForNestedRepeatingGroup(
                  formData,
                  childGroup && 'dataModelBindings' in childGroup ? childGroup?.dataModelBindings?.group : undefined,
                  groupElement?.dataModelBindings?.group,
                  childGroupIndex,
                ),
                baseGroupId: childGroup?.id,
                editIndex: -1,
                multiPageIndex: -1,
                dataModelBinding:
                  childGroup && 'dataModelBindings' in childGroup ? childGroup?.dataModelBindings?.group : undefined,
              };
            });
          });
        }
      } else {
        repeatingGroups[groupElement.id] = {
          index: -1,
          dataModelBinding: groupElement.dataModelBindings?.group,
          editIndex: -1,
          multiPageIndex: -1,
        };
      }
    }
  });
  return repeatingGroups;
}

/**
 * @deprecated Note: This functionality may not be present in the layout hierarchy, but prefer implementing it there
 *   over continued usage of this functionality.
 * @see useExprContext
 * @see useResolvedNode
 */
function getIndexForNestedRepeatingGroup(
  formData: any,
  groupBinding: string | undefined,
  parentGroupBinding: string | undefined,
  parentIndex: number,
): number {
  if (!groupBinding || !parentGroupBinding) {
    return -1;
  }
  const indexedGroupBinding = groupBinding.replace(parentGroupBinding, `${parentGroupBinding}[${parentIndex}]`);
  const groupFormData = Object.keys(formData)
    .filter((key) => key.startsWith(indexedGroupBinding))
    .sort();
  if (groupFormData && groupFormData.length > 0) {
    return getMaxIndexInKeys(groupFormData, true);
  }
  return -1;
}

export function getNextView(
  navOptions: ILayoutNavigation | undefined,
  layoutOrder: string[] | null,
  currentView: string,
  goBack?: boolean,
) {
  let result;
  if (navOptions) {
    if (goBack && navOptions.previous) {
      return navOptions.previous;
    }

    if (!goBack && navOptions.next) {
      return navOptions.next;
    }
  }

  if (layoutOrder) {
    const currentViewIndex = layoutOrder.indexOf(currentView);
    const newViewIndex = goBack ? currentViewIndex - 1 : currentViewIndex + 1;
    result = layoutOrder[newViewIndex];
  }

  return result;
}

export function removeRepeatingGroupFromUIConfig(
  repeatingGroups: IRepeatingGroups,
  repeatingGroupId: string,
  index: number,
  shiftData?: boolean,
): IRepeatingGroups {
  const newRepGroups = { ...repeatingGroups };
  delete newRepGroups[`${repeatingGroupId}-${index}`];
  if (shiftData) {
    const groupKeys = Object.keys(repeatingGroups).filter((key: string) => key.startsWith(repeatingGroupId));

    groupKeys.forEach((shiftFrom: string, keyIndex: number) => {
      if (keyIndex > index) {
        const shiftTo = groupKeys[keyIndex - 1];
        newRepGroups[shiftTo] = repeatingGroups[shiftFrom];
        delete newRepGroups[shiftFrom];
      }
    });
  }
  return newRepGroups;
}

export const getRepeatingGroupStartStopIndex = (
  repeatingGroupIndex: number,
  edit: Pick<IGroupEditPropertiesInternal, 'filter'> | undefined,
) => {
  if (typeof repeatingGroupIndex === 'undefined') {
    return { startIndex: 0, stopIndex: -1 };
  }

  const start = edit?.filter?.find(({ key }) => key === 'start')?.value;
  const stop = edit?.filter?.find(({ key }) => key === 'stop')?.value;
  const startIndex = start ? parseInt(start) : 0;
  const stopIndex = stop ? Math.min(parseInt(stop) - 1, repeatingGroupIndex) : repeatingGroupIndex;
  return { startIndex, stopIndex };
};

/**
 * Checks if there are required fields in this layout (or fields that potentially can be marked as required if some
 * dynamic behaviour dictates it).
 */
export function hasRequiredFields(page: LayoutPage): boolean {
  return !!page.flat(true).find((n) => 'required' in n.item && n.item.required === true);
}

/**
 * Find child components in layout (or inside some group) matching some criteria. Returns a list of just those
 * components.
 * @param layout Layout list
 * @param options Optional options
 * @param options.matching Function which should return true for every component to be included in the returned list.
 *    If not provided, all components are returned.
 * @param options.rootGroupId Component id for a group to use as root, instead of iterating the entire layout.
 * @deprecated Use LayoutNode instead. TODO: Rewrite usages
 * @see useExprContext
 * @see useResolvedNode
 */
export function findChildren(
  layout: ILayout,
  options?: {
    matching?: (component: CompExternal) => boolean;
    rootGroupId?: string;
  },
): CompExternal[] {
  const out: CompExternal[] = [];
  const root: string = options?.rootGroupId || '';
  const toConsider = new Set<string>();
  const otherGroupComponents: { [groupId: string]: Set<string> } = {};

  if (root) {
    for (const item of layout) {
      if (item.type === 'Group' && item.children) {
        for (const childId of item.children) {
          const cleanId = groupIsRepeatingExt(item) && item.edit?.multiPage ? childId.split(':')[1] : childId;
          if (item.id === root) {
            toConsider.add(cleanId);
          } else {
            if (typeof otherGroupComponents[item.id] === 'undefined') {
              otherGroupComponents[item.id] = new Set();
            }
            otherGroupComponents[item.id].add(cleanId);
          }
        }
      }
    }

    // Go over other groups, catching child groups defined out-of-order
    for (const otherGroupId in otherGroupComponents) {
      if (toConsider.has(otherGroupId)) {
        otherGroupComponents[otherGroupId].forEach((id) => toConsider.add(id));
      }
    }
  }

  for (const item of layout) {
    if (item.type === 'Group' || (root && !toConsider.has(item.id))) {
      continue;
    }
    if (options && options.matching) {
      options.matching(item) && out.push(item);
    } else {
      out.push(item);
    }
  }

  return out;
}

/**
 * Takes a layout and splits it into two return parts; the last will contain
 * all the buttons on the bottom of the input layout, while the first returned
 * value is the input layout except for these extracted components.
 */
export function extractBottomButtons(page: LayoutPage) {
  const all = [...page.children()];
  const toMainLayout: LayoutNode[] = [];
  const toErrorReport: LayoutNode[] = [];
  for (const node of all.reverse()) {
    const isButtonLike = node.isType('ButtonGroup') || (node.def.canRenderInButtonGroup() && !node.isType('Custom'));
    if (isButtonLike && toMainLayout.length === 0) {
      toErrorReport.push(node);
    } else {
      toMainLayout.push(node);
    }
  }

  return [toMainLayout.reverse(), toErrorReport.reverse()];
}

/**
 * Some tasks other than data (for instance confirm, or other in the future) can be configured to behave like data steps
 * @param task the task
 * @param layoutSets the layout sets
 */
export function behavesLikeDataTask(task: string | null | undefined, layoutSets: ILayoutSets | null): boolean {
  if (!task) {
    return false;
  }

  return layoutSets?.sets.some((set) => set.tasks?.includes(task)) || false;
}

/**
 * Returns the filtered indices of a repeating group.
 * This is a buggy implementation, but is used for backward compatibility until a new major version is released.
 * @see https://github.com/Altinn/app-frontend-react/issues/339#issuecomment-1286624933
 * @param formData IFormData
 * @param filter IGroupEditProperties.filter or undefined.
 * @returns a list of indices for repeating group elements after applying filters, or null if no filters are provided or if no elements match.
 * @deprecated Refrain from using this function, prefer implementing filtering based on expressions instead
 * @see https://github.com/Altinn/app-frontend-react/issues/584
 */
export function getRepeatingGroupFilteredIndices(formData: IFormData, filter?: IGroupFilter[]): number[] | null {
  if (filter && filter.length > 0) {
    const rule = filter.at(-1);
    const formDataKeys: string[] = Object.keys(formData).filter((key) => {
      const keyWithoutIndex = key.replaceAll(/\[\d*]/g, '');
      return keyWithoutIndex === rule?.key && formData[key] === rule.value;
    });
    if (formDataKeys && formDataKeys.length > 0) {
      return formDataKeys.map((key) => {
        const match = key.match(/\[(\d*)]/g);
        const currentIndex = (match && match[match.length - 1]) || '[0]';
        return parseInt(currentIndex.substring(1, currentIndex.indexOf(']')), 10);
      });
    }
  }
  return null;
}
