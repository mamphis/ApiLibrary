import assert from "assert";
import { test, describe, it } from "node:test";
import { parseSearchParams } from "./parseSearchParams";

describe("parseSearchParams", () => {
    test("parseSearchParams parses valid search string", () => {
        const input = 'name _eq "John";age _like "30"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            { field: "name", operator: "_eq", value: "John" },
            { field: "age", operator: "_like", value: "30" },
        ]);
    });

    test("parseSearchParams parses single expression", () => {
        const input = 'status _eq "active"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            { field: "status", operator: "_eq", value: "active" },
        ]);
    });

    test("parseSearchParams throws on invalid input (missing quotes)", () => {
        const input = "name _eq John";
        assert.throws(() => parseSearchParams(input), /Expected VALUE/);
    });

    test("parseSearchParams throws on invalid input (missing operator)", () => {
        const input = 'name "John"';
        assert.throws(() => parseSearchParams(input), /Expected OPERATOR/);
    });

    test("parseSearchParams throws on invalid input (missing value)", () => {
        const input = "name _eq";
        assert.throws(() => parseSearchParams(input), /Expected VALUE/);
    });

    test("parseSearchParams throws on invalid input (invalid operator)", () => {
        const input = 'name _invalid "John"';
        assert.throws(() => parseSearchParams(input), /Lexer error:/);
    });

    // test for boolean. Boolean must be _eq
    test("parseSearchParams parses boolean value", () => {
        const input = 'isActive _eq "true"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            { field: "isActive", operator: "_eq", value: true },
        ]);
    });

    test("parseSearchParams parses multiple expressions with different operators", () => {
        const input = 'name _eq "John";age _like "30";isActive _eq "true"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            { field: "name", operator: "_eq", value: "John" },
            { field: "age", operator: "_like", value: "30" },
            { field: "isActive", operator: "_eq", value: true },
        ]);
    });

    // Test for boolean, boolean _like throws an error
    test("parseSearchParams throws on boolean _like", () => {
        const input = 'isActive _like "true"';
        assert.throws(() => parseSearchParams(input), /Parser error:/);
    });

    // test for boolean, boolean _eq is false
    test("parseSearchParams parses boolean _eq false", () => {
        const input = 'isActive _eq "false"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            { field: "isActive", operator: "_eq", value: false },
        ]);
    });

    // test for boolean, boolean is false and like throws an error
    test("parseSearchParams throws on boolean _like false", () => {
        const input = 'isActive _like "false"';
        assert.throws(() => parseSearchParams(input), /Parser error:/);
    });

    // implement tests for objects
    test("parseSearchParams parses object value", () => {
        const input = 'address.city _eq "New York"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            {
                object: "address",
                value: {
                    field: "city",
                    operator: "_eq",
                    value: "New York",
                },
            },
        ]);
    });

    // test deep object with 2 .s
    test("parseSearchParams parses deep object value", () => {
        const input = 'address.city.zip _eq "10001"';
        const result = parseSearchParams(input);
        assert.deepStrictEqual(result, [
            {
                object: "address",
                value: {
                    object: "city",
                    value: {
                        field: "zip",
                        operator: "_eq",
                        value: "10001",
                    },
                },
            },
        ]);
    });
});
