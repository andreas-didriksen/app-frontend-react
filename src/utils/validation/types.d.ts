import type { IApplicationMetadata } from 'src/features/applicationMetadata';
import type { IAttachments } from 'src/features/attachments';
import type { IJsonSchemas } from 'src/features/datamodel';
import type { Expression } from 'src/features/expressions/types';
import type { IFormData } from 'src/features/formData';
import type { IUseLanguage } from 'src/hooks/useLanguage';
import type { ILayoutSets } from 'src/types';
import type { IInstance } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { BackendValidationSeverity } from 'src/utils/validation/backendValidationSeverity';

/**
 * Contains all of the necessary elements from the redux store to run frontend validations.
 */
export type IValidationContext = {
  langTools: IUseLanguage;
  formData: IFormData;
  attachments: IAttachments;
  application: IApplicationMetadata | null;
  instance: IInstance | null;
  layoutSets: ILayoutSets | null;
  schemas: IJsonSchemas;
  customValidation: IExpressionValidations | null;
};

export type ValidationContextGenerator = (node: LayoutNode | undefined) => IValidationContext;

/**
 * IValidationObject is an intermediate format that contains the information necessary to build validations for the redux store.
 * It is the format returned by the frontend validation methods.
 */
export type IValidationObject = IValidationMessage<T> | IEmptyValidation;

/**
 * A single validation mesage generated by the frontend.
 */
export type IValidationMessage<T extends ValidationSeverity> = {
  empty: false;
  pageKey: string;
  componentId: string;
  bindingKey: string;
  severity: T;
  message: string;
  invalidDataTypes: boolean;
  rowIndices: number[];
};

/**
 * This should only be generated for a component when all of its validation methods have returned no errors.
 */
export type IEmptyValidation = {
  empty: true;
  pageKey: string;
  componentId: string;
  rowIndices: number[];
};

export type ValidationSeverity = 'errors' | 'warnings' | 'info' | 'success' | 'fixed' | 'unspecified';

/**
 * The 'Result' formats are returned to the redux reducers to update the state.
 */
export interface IValidationResult {
  invalidDataTypes?: boolean;
  validations: IValidations;
  fixedValidations?: IValidationMessage<'fixed'>[];
}

export interface ILayoutValidationResult {
  invalidDataTypes?: boolean;
  validations: ILayoutValidations;
  fixedValidations?: IValidationMessage<'fixed'>[];
}

export interface IComponentValidationResult {
  invalidDataTypes?: boolean;
  validations: IComponentValidations;
  fixedValidations?: IValidationMessage<'fixed'>[];
}

/**
 * IValidations is the format used to store validation messages in redux.
 * Example:
 *
 * {                                              // IValidations
 *   "page-1": {                                  // ILayoutValidations
 *     "component-1": {                           // IComponentValidations
 *       "simpleBinding": {                       // IComponentBindingValidation
 *         "errors": ["errorMesssage1"],
 *         "warning": ["warning1", "warning2"],
 *       }
 *     }
 *   }
 * }
 */

export interface IValidations {
  [pageKey: string]: ILayoutValidations;
}

export interface ILayoutValidations {
  [componentId: string]: IComponentValidations;
}

export interface IComponentValidations {
  [bindingKey: string]: IComponentBindingValidation | undefined;
}

export type IComponentBindingValidation = {
  [severity in ValidationSeverity]?: string[];
};

export type ValidationKey = keyof IComponentBindingValidation;
export type ValidationKeyOrAny = ValidationKey | 'any';

/**
 * This format is used by the backend to send validation issues to the frontend.
 */
export interface BackendValidationIssue {
  code: string;
  description: string;
  field: string;
  scope: string | null;
  severity: BackendValidationSeverity;
  targetId: string;
  source?: string;
  customTextKey?: string;
}

/**
 * Expression validation object.
 */
export type IExpressionValidation = {
  message: string;
  condition: Expression | ExprValToActual;
  severity: ValidationSeverity;
};

/**
 * Expression validations for all fields.
 */
export type IExpressionValidations = {
  [field: string]: IExpressionValidation[];
};

/**
 * Expression validation or definition with references resolved.
 */
export type IExpressionValidationRefResolved = {
  message: string;
  condition: Expression | ExprValToActual;
  severity?: ValidationSeverity;
};

/**
 * Unresolved expression validation or definition from the configuration file.
 */
export type IExpressionValidationRefUnresolved =
  | IExpressionValidationRefResolved
  | {
      // If extending using a reference, assume that message and condition are inherited if undefined. This must be verified at runtime.
      message?: string;
      condition?: Expression | ExprValToActual;
      severity?: ValidationSeverity;
      ref: string;
    };

/**
 * Expression validation configuration file type.
 */
export type IExpressionValidationConfig = {
  validations: { [field: string]: (IExpressionValidationRefUnresolved | string)[] };
  definitions: { [name: string]: IExpressionValidationRefUnresolved };
};
