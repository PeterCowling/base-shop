const name = "hoist-vi";
const version = 1;

const HOIST_METHODS = ["mock", "doMock", "unmock"];
const VI_GLOBALS_MODULE_NAME = "vitest";
const VI_GLOBAL_NAME = "vi";

const factory = ({ configSet }) => {
  const ts = configSet.compilerModule;
  const importNamesOfViObj = [];

  const isViGlobalImport = (node) =>
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === VI_GLOBALS_MODULE_NAME;

  const shouldHoistExpression = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      HOIST_METHODS.includes(node.expression.name.text)
    ) {
      if (importNamesOfViObj.length) {
        return (
          (ts.isIdentifier(node.expression.expression) &&
            importNamesOfViObj.includes(node.expression.expression.text)) ||
          (ts.isPropertyAccessExpression(node.expression.expression) &&
            ts.isIdentifier(node.expression.expression.expression) &&
            importNamesOfViObj.includes(
              node.expression.expression.expression.text
            )) ||
          shouldHoistExpression(node.expression.expression)
        );
      }
      return (
        (ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === VI_GLOBAL_NAME) ||
        shouldHoistExpression(node.expression.expression)
      );
    }
    return false;
  };

  const isHoistableStatement = (node) =>
    ts.isExpressionStatement(node) && shouldHoistExpression(node.expression);

  const canHoistInBlockScope = (node) =>
    !!node.statements.find(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.find(
          (decl) =>
            ts.isIdentifier(decl.name) && decl.name.text !== VI_GLOBAL_NAME
        ) &&
        node.statements.find((stmt) => isHoistableStatement(stmt))
    );

  const sortStatements = (statements) => {
    if (statements.length <= 1) return statements;
    return statements.sort((stmtA, stmtB) =>
      isViGlobalImport(stmtA) ||
      (isHoistableStatement(stmtA) &&
        !isHoistableStatement(stmtB) &&
        !isViGlobalImport(stmtB))
        ? -1
        : 1
    );
  };

  const replaceViMockWithJestMock = (node) => {
    // Replace vi.mock/doMock/unmock(...) with jest.mock/doMock/unmock(...)
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      HOIST_METHODS.includes(node.expression.name.text) &&
      ts.isIdentifier(node.expression.expression) &&
      (node.expression.expression.text === VI_GLOBAL_NAME ||
        importNamesOfViObj.includes(node.expression.expression.text))
    ) {
      return ts.factory.updateCallExpression(
        node,
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("jest"),
          ts.factory.createIdentifier(node.expression.name.text)
        ),
        node.typeArguments,
        node.arguments
      );
    }
    return node;
  };

  const createVisitor = (ctx, sf) => {
    // First, collect all vi import names from the source file
    sf.statements.forEach((stmt) => {
      if (
        isViGlobalImport(stmt) &&
        stmt.importClause?.namedBindings &&
        (ts.isNamespaceImport(stmt.importClause.namedBindings) ||
          ts.isNamedImports(stmt.importClause.namedBindings))
      ) {
        const namedBindings = stmt.importClause.namedBindings;
        const viImportName = ts.isNamespaceImport(namedBindings)
          ? namedBindings.name.text
          : namedBindings.elements.find(
              (element) =>
                element.name.text === VI_GLOBAL_NAME ||
                element.propertyName?.text === VI_GLOBAL_NAME
            )?.name.text;
        if (viImportName) {
          importNamesOfViObj.push(viImportName);
        }
      }
    });

    const visitor = (node) => {
      // Replace vi.mock calls with jest.mock before visiting children
      const replacedNode = replaceViMockWithJestMock(node);

      // Visit children with the replaced node
      const resultNode = ts.visitEachChild(replacedNode, visitor, ctx);

      // Handle hoisting for blocks
      if (ts.isBlock(resultNode) && canHoistInBlockScope(resultNode)) {
        const newStatements = ts.factory.createNodeArray(
          sortStatements(resultNode.statements)
        );
        return ts.factory.updateBlock(resultNode, newStatements);
      }

      // Handle hoisting for source files
      if (ts.isSourceFile(resultNode)) {
        const newStatements = ts.factory.createNodeArray(
          sortStatements(resultNode.statements)
        );
        importNamesOfViObj.length = 0;
        return ts.factory.updateSourceFile(
          resultNode,
          newStatements,
          resultNode.isDeclarationFile,
          resultNode.referencedFiles,
          resultNode.typeReferenceDirectives,
          resultNode.hasNoDefaultLib,
          resultNode.libReferenceDirectives
        );
      }

      return resultNode;
    };
    return visitor;
  };

  return (ctx) => (sf) => ts.visitNode(sf, createVisitor(ctx, sf));
};

module.exports = {
  factory,
  name,
  version,
};
