/**
 * Coverage for #1303 — typeDefs.ts had zero test coverage. Verifies the SDL
 * parses and builds into a valid, executable GraphQL schema.
 */
import { buildASTSchema } from 'graphql';
import { typeDefs } from '../typeDefs';

describe('GraphQL typeDefs', () => {
  it('parses into a Document node', () => {
    expect(typeDefs.kind).toBe('Document');
  });

  it('builds into a valid schema without throwing', () => {
    expect(() => buildASTSchema(typeDefs)).not.toThrow();
  });

  it('defines Query and Mutation root types', () => {
    const schema = buildASTSchema(typeDefs);
    expect(schema.getQueryType()?.name).toBe('Query');
    expect(schema.getMutationType()?.name).toBe('Mutation');
  });

  it('exposes the expected Query fields', () => {
    const schema = buildASTSchema(typeDefs);
    const fields = Object.keys(schema.getQueryType()?.getFields() ?? {});
    expect(fields).toEqual(expect.arrayContaining(['me', 'user', 'posts', 'post']));
  });

  it('exposes the expected Mutation fields', () => {
    const schema = buildASTSchema(typeDefs);
    const fields = Object.keys(schema.getMutationType()?.getFields() ?? {});
    expect(fields).toEqual(expect.arrayContaining(['createPost', 'updatePost', 'deletePost']));
  });

  it('defines the User and Post object types', () => {
    const schema = buildASTSchema(typeDefs);
    expect(schema.getType('User')).toBeDefined();
    expect(schema.getType('Post')).toBeDefined();
  });

  it('defines the DateTime scalar used by User/Post', () => {
    const schema = buildASTSchema(typeDefs);
    expect(schema.getType('DateTime')).toBeDefined();
  });
});
