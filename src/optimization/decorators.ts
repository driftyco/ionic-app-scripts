import {
  ArrayLiteralExpression,
  BinaryExpression,
  CallExpression,
  ExpressionStatement,
  FunctionExpression,
  Identifier,
  ObjectLiteralExpression,
  ParenthesizedExpression,
  PropertyAccessExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind } from 'typescript';

import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { getStringPropertyValue, isIonic, isSrcOrIonicOrIonicDeps } from '../util/helpers';
import { MagicString } from '../util/interfaces';
import { findNodes, getTypescriptSourceFile } from '../util/typescript-utils';

export function addPureAnnotation(filePath: string, originalFileContent: string, magicString: MagicString) {
  Logger.debug(`[decorators] addPureAnnotation: processing ${filePath} ...`);
  const typescriptFile = getTypescriptSourceFile(filePath, originalFileContent);
  const parenthesizedExpressions = findNodes(typescriptFile, typescriptFile, SyntaxKind.ParenthesizedExpression, false) as ParenthesizedExpression[];
  parenthesizedExpressions.forEach(parenthesizedExpression => {

    if (parenthesizedExpression.expression && parenthesizedExpression.expression.kind === SyntaxKind.CallExpression
        && (parenthesizedExpression.expression as CallExpression).expression
        && (parenthesizedExpression.expression as CallExpression).expression.kind === SyntaxKind.FunctionExpression
        && !((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).name
        && ((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).parameters) {

      // it's an iffe
      if (((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).parameters.length === 0) {

        magicString.prependLeft(parenthesizedExpression.pos, PURE_ANNOTATION);

      } else if (((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).parameters[0]
                && ((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).parameters[0].name
                && (((parenthesizedExpression.expression as CallExpression).expression as FunctionExpression).parameters[0].name as Identifier).text === '_super') {


        magicString.prependLeft(parenthesizedExpression.pos, PURE_ANNOTATION);

      }
    }
  });
  return magicString;
}

export function purgeTranspiledDecorators(filePath: string, originalFileContent: string, magicString: MagicString) {
  if (isSrcOrIonicOrIonicDeps(filePath)) {
    Logger.debug(`[decorators] purgeTranspiledDecorators: processing ${filePath} ...`);
    const typescriptFile = getTypescriptSourceFile(filePath, originalFileContent);
    const expressionsToRemove = getTranspiledDecoratorExpressionStatements(typescriptFile);
    expressionsToRemove.forEach(expression => {
      magicString.overwrite(expression.pos, expression.end, '');
    });
    Logger.debug(`[decorators] purgeTranspiledDecorators: processing ${filePath} ...`);
  }
  return magicString;
}

function getTranspiledDecoratorExpressionStatements(sourceFile: SourceFile) {
  const expressionStatements = findNodes(sourceFile, sourceFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
  const toReturn: ExpressionStatement[] = [];
  expressionStatements.forEach(expressionStatement => {
    if (expressionStatement && expressionStatement.expression
          && expressionStatement.expression.kind === SyntaxKind.CallExpression
          && (expressionStatement.expression as CallExpression).expression
          && ((expressionStatement.expression as CallExpression).expression as Identifier).text === '___decorate'
          && (expressionStatement.expression as CallExpression).arguments
          && (expressionStatement.expression as CallExpression).arguments.length > 0
          && (expressionStatement.expression as CallExpression).arguments[0].kind === SyntaxKind.ArrayLiteralExpression
          && ((expressionStatement.expression as CallExpression).arguments[0] as ArrayLiteralExpression).elements
          && ((expressionStatement.expression as CallExpression).arguments[0] as ArrayLiteralExpression).elements.length > 0
          && (((expressionStatement.expression as CallExpression).arguments[0] as ArrayLiteralExpression).elements[0] as CallExpression).expression
          && (((expressionStatement.expression as CallExpression).arguments[0] as ArrayLiteralExpression).elements[0] as CallExpression).expression.kind === SyntaxKind.Identifier
          && canRemoveDecoratorNode(((((expressionStatement.expression as CallExpression).arguments[0] as ArrayLiteralExpression).elements[0] as CallExpression).expression as Identifier).text)
          ) {

      toReturn.push(expressionStatement);

    } else if (expressionStatement && expressionStatement.expression
        && expressionStatement.expression.kind === SyntaxKind.BinaryExpression
        && (expressionStatement.expression as BinaryExpression).right
        && (expressionStatement.expression as BinaryExpression).right.kind === SyntaxKind.CallExpression
        && ((expressionStatement.expression as BinaryExpression).right as CallExpression).expression
        && (((expressionStatement.expression as BinaryExpression).right as CallExpression).expression as Identifier).text === '___decorate'
        && ((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments
        && ((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments.length > 0
        && ((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments[0].kind === SyntaxKind.ArrayLiteralExpression
        && (((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments[0] as ArrayLiteralExpression).elements
        && (((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments[0] as ArrayLiteralExpression).elements.length > 0 ) {

      let immovableDecoratorFound = false;

      // remove the last item in the array as it is always __metadata() and should not be considered here
      const numElements = (((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments[0] as ArrayLiteralExpression).elements.length - 1;
      const elementsToEvaluate = (((expressionStatement.expression as BinaryExpression).right as CallExpression).arguments[0] as ArrayLiteralExpression).elements.slice(0, numElements);
      for (const element of elementsToEvaluate) {
        if (element.kind === SyntaxKind.CallExpression && (element as CallExpression).expression
          && !canRemoveDecoratorNode(((element as CallExpression).expression as Identifier).text)) {

          immovableDecoratorFound = true;
          break;
        }
      }
      if (!immovableDecoratorFound) {
        toReturn.push(expressionStatement);
      }
    }
  });
  return toReturn;
}

export function purgeStaticFieldDecorators(filePath: string, originalFileContent: string, magicString: MagicString) {
  if (isSrcOrIonicOrIonicDeps(filePath)) {
    Logger.debug(`[decorators] purgeStaticFieldDecorators: processing ${filePath} ...`);
    const typescriptFile = getTypescriptSourceFile(filePath, originalFileContent);

    const decoratorExpressionStatements = getDecoratorsExpressionStatements(typescriptFile);
    removeDecorators(decoratorExpressionStatements, magicString);

    const propDecoratorsExpressionStatements = getPropDecoratorsExpressionStatements(typescriptFile);
    removePropDecorators(propDecoratorsExpressionStatements, magicString);

    Logger.debug(`[decorators] purgeStaticFieldDecorators: processing ${filePath} ... DONE`);
  }
  return magicString;
}

export function purgeStaticCtorFields(filePath: string, originalFileContent: string, magicString: MagicString) {
  // TODO - we could extend this to other libs and stuff too such as material 2, but that doesn't seem
  // particularly maintainable
  if (isIonic(filePath) && !isIonicEntryComponent(filePath)) {
    Logger.debug(`[decorators] purgeStaticCtorFields: processing ${filePath} ...`);
    const typescriptFile = getTypescriptSourceFile(filePath, originalFileContent);
    const expressionStatements = findNodes(typescriptFile, typescriptFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
    const toPurge: ExpressionStatement[] = [];
    for (const expressionStatement of expressionStatements) {
      if (expressionStatement.expression && expressionStatement.expression.kind === SyntaxKind.BinaryExpression
          && (expressionStatement.expression as BinaryExpression).left
          && (expressionStatement.expression as BinaryExpression).left.kind === SyntaxKind.PropertyAccessExpression
          && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name
          && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name.text === 'ctorParameters'
          ) {

        toPurge.push(expressionStatement);

      }
    }

    toPurge.forEach(tsNode => {
      magicString.overwrite(tsNode.pos, tsNode.end, '');
    });

    Logger.debug(`[decorators] purgeStaticFieldDecorators: processing ${filePath} ... DONE`);
  }
  return magicString;
}

function isIonicEntryComponent(filePath: string) {
  if (filePath === getStringPropertyValue(Constants.ENV_ACTION_SHEET_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_ALERT_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_APP_ROOT_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_LOADING_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_MODAL_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_PICKER_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_POPOVER_COMPONENT_PATH)) {
    return true;
  } else if (filePath === getStringPropertyValue(Constants.ENV_TOAST_COMPONENT_PATH)) {
    return true;
  }
  return false;
}

function getDecoratorsExpressionStatements(typescriptFile: SourceFile) {
  const expressionStatements = findNodes(typescriptFile, typescriptFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
  const decoratorExpressionStatements: ExpressionStatement[] = [];
  for (const expressionStatement of expressionStatements) {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).left
        && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name
        &&  ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name.text === 'decorators') {
      decoratorExpressionStatements.push(expressionStatement);
    }
  }
  return decoratorExpressionStatements;
}

function getPropDecoratorsExpressionStatements(typescriptFile: SourceFile) {
  const expressionStatements = findNodes(typescriptFile, typescriptFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
  const decoratorExpressionStatements: ExpressionStatement[] = [];
  for (const expressionStatement of expressionStatements) {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).left && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name &&  ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name.text === 'propDecorators') {
      decoratorExpressionStatements.push(expressionStatement);
    }
  }
  return decoratorExpressionStatements;
}

function removeDecorators(decoratorExpressionStatements: ExpressionStatement[], magicString: MagicString) {
  decoratorExpressionStatements.forEach(expressionStatement => {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).right && ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements) {
      const numPotentialNodesToRemove = ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements.length;
      const objectLiteralsToPurge: ObjectLiteralExpression[] = [];
      ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements.forEach((objectLiteral: ObjectLiteralExpression) => {
        if (objectLiteral.properties && objectLiteral.properties.length > 1) {
          if (objectLiteral.properties[0].name && (objectLiteral.properties[0].name as Identifier).text === 'type'
            && canRemoveDecoratorNode(((objectLiteral.properties[0] as PropertyAssignment).initializer as Identifier).text)) {
              // sweet, we can remove the object literal
              objectLiteralsToPurge.push(objectLiteral);
          }
        }
      });
      if (objectLiteralsToPurge.length === numPotentialNodesToRemove) {
        // we are removing all decorators, so just remove the entire expression node
        magicString.overwrite(expressionStatement.pos, expressionStatement.end, '');
      } else {
        // we are removing a subset of decorators, so remove the individual object literal findNodes
        objectLiteralsToPurge.forEach(objectLiteralToPurge => {
          magicString.overwrite(objectLiteralToPurge.pos, objectLiteralToPurge.end, '');
        });
      }
    }
  });
}

function removePropDecorators(propDecoratorExpressionStatements: ExpressionStatement[], magicString: MagicString) {
  propDecoratorExpressionStatements.forEach(expressionStatement => {
    magicString.overwrite(expressionStatement.pos, expressionStatement.end, '');
  });
}

function canRemoveDecoratorNode(decoratorType: string) {
  if (decoratorType === COMPONENT) {
    return true;
  } else if (decoratorType === CONTENT_CHILD_DECORATOR) {
    return true;
  } else if (decoratorType === CONTENT_CHILDREN_DECORATOR) {
    return true;
  } else if (decoratorType === DIRECTIVE_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_BINDING_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_LISTENER_DECORATOR) {
    return true;
  } else if (decoratorType === INPUT_DECORATOR) {
    return true;
  } else if (decoratorType === NG_MODULE_DECORATOR) {
    return true;
  } else if (decoratorType === OUTPUT_DECORATOR) {
    return true;
  } else if (decoratorType === PIPE_DECORATOR) {
    return true;
  } else if (decoratorType === VIEW_CHILD_DECORATOR) {
    return true;
  } else if (decoratorType === VIEW_CHILDREN_DECORATOR) {
    return true;
  } else if (decoratorType === IONIC_PAGE_DECORATOR) {
    return true;
  }
  return false;
}

export const COMPONENT = 'Component';
export const CONTENT_CHILD_DECORATOR = 'ContentChild';
export const CONTENT_CHILDREN_DECORATOR = 'ContentChildren';
export const DIRECTIVE_DECORATOR = 'Directive';
export const HOST_DECORATOR = 'Host';
export const HOST_BINDING_DECORATOR = 'HostBinding';
export const HOST_LISTENER_DECORATOR = 'HostListener';
export const INPUT_DECORATOR = 'Input';
export const NG_MODULE_DECORATOR = 'NgModule';
export const OUTPUT_DECORATOR = 'Output';
export const PIPE_DECORATOR = 'Pipe';
export const VIEW_CHILD_DECORATOR = 'ViewChild';
export const VIEW_CHILDREN_DECORATOR = 'ViewChildren';
export const IONIC_PAGE_DECORATOR = 'IonicPage';

export const PURE_ANNOTATION = ' /*#__PURE__*/';
