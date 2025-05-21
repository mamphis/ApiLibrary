import { tryCatch } from "../helper/tryCatch";

type TokenType = "FIELD" | "OPERATOR" | "VALUE" | "DIVIDER" | "DOT" | "EOF";
const operators = ["_eq", "_like"] as const;
type Operator = (typeof operators)[number];
type Token = {
    type: TokenType;
    value?: string;
};

export type FieldExpression = {
    field: string;
    operator: Operator;
    value: string | boolean;
};

export type ObjectExpression = {
    object: string;
    value: SearchExpression;
};

export type SearchExpression = FieldExpression | ObjectExpression;

export function isObjectExpression(
    expression: SearchExpression
): expression is ObjectExpression {
    return (expression as ObjectExpression).object !== undefined;
}

export function isFieldExpression(
    expression: SearchExpression
): expression is FieldExpression {
    return (expression as FieldExpression).field !== undefined;
}

class Source {
    currentIndex = 0;

    constructor(public source: string) {}

    peek(offset: number = 0): string {
        return this.source[this.currentIndex + offset];
    }

    next(): string {
        if (this.currentIndex >= this.source.length) {
            throw new Error("No more characters to read");
        }

        const char = this.source[this.currentIndex];
        this.currentIndex++;
        return char;
    }

    isEof(): boolean {
        return this.currentIndex >= this.source.length;
    }
}

const lexer = (source: string): Token[] => {
    const tokens = [] as Token[];

    const sourceInstance = new Source(source);

    while (!sourceInstance.isEof()) {
        const char = sourceInstance.peek();

        if (char === " ") {
            sourceInstance.next();
            continue;
        }

        if (char === ";") {
            tokens.push({ type: "DIVIDER", value: ";" });
            sourceInstance.next();
            continue;
        }

        if (char === ".") {
            tokens.push({ type: "DOT", value: "." });
            sourceInstance.next();
            continue;
        }

        if (char === "_") {
            let operator = sourceInstance.next();

            while (
                !sourceInstance.isEof() &&
                /^[a-zA-Z]/.test(sourceInstance.peek())
            ) {
                operator += sourceInstance.next();
            }

            if (!operators.includes(operator as Operator)) {
                throw new Error(`Unexpected operator: ${operator}`);
            }

            tokens.push({ type: "OPERATOR", value: operator });
            continue;
        }

        if (char === '"') {
            sourceInstance.next();
            let value = "";
            while (!sourceInstance.isEof() && sourceInstance.peek() !== '"') {
                value += sourceInstance.next();
            }
            if (sourceInstance.isEof()) {
                throw new Error(
                    "Unexpected end of input, expected closing quote"
                );
            }
            sourceInstance.next(); // consume closing quote
            tokens.push({ type: "VALUE", value });
            continue;
        }

        if (/^[a-zA-Z_]/.test(char)) {
            let field = "";
            while (
                !sourceInstance.isEof() &&
                /^[a-zA-Z0-9_]/.test(sourceInstance.peek())
            ) {
                field += sourceInstance.next();
            }
            tokens.push({ type: "FIELD", value: field });
            continue;
        }

        throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
};

const parser = (tokens: Token[]): SearchExpression[] => {
    let current = 0;

    const parseField = (): string | ObjectExpression => {
        let token = tokens[current];
        if (token && token.type === "FIELD") {
            let fields: string[] = [token.value!];
            current++;
            // Collect all dot-separated fields
            while (tokens[current] && tokens[current].type === "DOT") {
                current++; // skip DOT
                const nextToken = tokens[current];
                if (!nextToken || nextToken.type !== "FIELD") {
                    throw new Error(`Expected FIELD after DOT, but got ${nextToken?.type}`);
                }
                fields.push(nextToken.value!);
                current++;
            }
            // If only one field, return as string
            if (fields.length === 1) return fields[0];
            // If multiple fields, build nested ObjectExpression
            // Start from the innermost field
            let expr: ObjectExpression | FieldExpression = { field: fields[fields.length - 1], operator: undefined as any, value: undefined as any };
            for (let i = fields.length - 2; i >= 0; i--) {
                expr = { object: fields[i], value: expr };
            }
            return expr as ObjectExpression;
        }
        throw new Error(`Expected FIELD, but got ${token?.type}`);
    };

    const parseOperator = (): Operator => {
        const token = tokens[current];
        if (token && token.type === "OPERATOR") {
            current++;
            if (!operators.includes(token.value as Operator)) {
                throw new Error(`Unexpected operator: ${token.value}`);
            }

            return token.value as Operator;
        }
        throw new Error(`Expected OPERATOR, but got ${token?.type}`);
    };

    const parseValue = () => {
        const token = tokens[current];
        if (token && token.type === "VALUE") {
            current++;
            if (token.value === "true" || token.value === "false") {
                return token.value === "true";
            }

            return token.value;
        }
        throw new Error(`Expected VALUE, but got ${token?.type}`);
    };

    const parseDivider = () => {
        const token = tokens[current];
        if (token && token.type === "DIVIDER") {
            current++;
            return token.value;
        }
        throw new Error(`Expected DIVIDER, but got ${token?.type}`);
    };

    const parseExpression = (): SearchExpression => {
        const fieldOrObj = parseField();
        const operator = parseOperator();
        const value = parseValue();
        if (fieldOrObj === undefined || operator === undefined || value === undefined) {
            throw new Error("Incomplete expression");
        }
        if (typeof value === 'boolean' && operator !== "_eq") {
            throw new Error(`Boolean values can only use _eq operator`);
        }
        // If fieldOrObj is a string, it's a FieldExpression
        if (typeof fieldOrObj === 'string') {
            return {
                field: fieldOrObj,
                operator,
                value,
            };
        }
        // If fieldOrObj is an ObjectExpression, recursively fill the innermost FieldExpression
        let curr: any = fieldOrObj;
        while (curr.value && typeof curr.value === 'object' && !(curr.value as FieldExpression).operator) {
            curr = curr.value;
        }
        curr.operator = operator;
        curr.value = value;
        return fieldOrObj;
    };

    const parseSearch = () => {
        const expressions: SearchExpression[] = [];
        while (current < tokens.length) {
            const token = tokens[current];
            if (token.type === "EOF") {
                if (current !== tokens.length - 1) {
                    throw new Error(
                        `Unexpected token: ${token.type}. Still Tokens Present`
                    );
                }
                break;
            }
            if (token.type === "DIVIDER") {
                parseDivider();
                continue;
            }
            const expression = parseExpression();
            expressions.push(expression);
        }
        return expressions;
    };

    const parse = (): SearchExpression[] => {
        const search = parseSearch();
        return search;
    };

    return parse();
};

export const parseSearchParams = (search: string): SearchExpression[] => {
    const [tokens, lexerError] = tryCatch(lexer)(search);
    if (lexerError) {
        throw new Error(`Lexer error: ${lexerError.message}`);
    }
    const [ast, parserError] = tryCatch(parser)(tokens);
    if (parserError) {
        throw new Error(`Parser error: ${parserError.message}`);
    }

    return ast;
};
