import chalk from "chalk";

type Token = {
    type: string;
    value: string;
}
export type MessageTemplateOptions = {
    color: boolean;
};

export class MessageTemplate {
    constructor(private template: string, private options: MessageTemplateOptions = { color: false }) {

        this.tokenize();
    }

    private tokens: Token[] = [];
    private tokenize(): void {
        let value = '';
        let index = 0;

        while (index < this.template.length) {
            if (this.template[index] === '{') {
                if (value) {
                    this.tokens.push({ type: 'string', value });
                    value = '';
                }

                let token = '';
                index++;
                while (this.template[index] !== '}' && index < this.template.length && this.template[index - 1] !== '\\') { 
                    token += this.template[index];
                    index++;
                }

                this.tokens.push({ type: 'token', value: token });
            } else {
                value += this.template[index];
            }

            index++;
        }

        if (value) {
            this.tokens.push({ type: 'string', value });
        }
    }
    
    private resolveToken(token: Token, context?: Record<string, any>): string {
        if (!context) {
            return `{${token.value}}`;
        }

        if (context[token.value]) {
            return chalk.magenta(context[token.value]);
        }

        // if the token starts with a @ the value is an object that needs to be resolved
        if (token.value.startsWith('@')) {
            const keys = token.value.substring(1).split('.');
            let value = context;

            for (const key of keys) {
                if (value[key]) {
                    value = value[key];
                } else {
                    return `{${token.value}}`;
                }
            }

            if (typeof value === 'object') {
                return chalk.magenta(JSON.stringify(value));
            }

            return chalk.magenta(value);
        }

        return '';
    }

    render(context?: Record<string, any>): string {
        return this.tokens.map(token => {
            if (token.type === 'string') {
                return token.value;
            } else {
                return this.resolveToken(token, context);
            }
        }).join('');
    }
}