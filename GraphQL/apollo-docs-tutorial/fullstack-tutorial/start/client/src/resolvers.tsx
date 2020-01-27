import gql from "graphql-tag";
import { ApolloCache } from "apollo-cache";
import * as GetCartItemTypes from "./pages/__generated__/GetCartItems";
import * as LaunchTileTypes from "./pages/__generated__/LaunchTile";
import { Resolvers } from "apollo-client";

export const typeDefs = gql`
  extend type Query {
    isLoggedIn: Boolean!
    cartItems: [ID!]!
  }

  extend type Launch {
    isInCart: Boolean!
  }

  extend type Mutation {
    addOrRemoveFromCart(id: ID!): [ID!]!
  }
`;

export const schema = gql`
  extends type Launch {
    isInCart: Boolean!
  }
`;

type ResolverFn = (
  parent: any,
  args: any,
  { cache }: { cache: ApolloCache<any> }
) => any;

interface ResolverMap {
  [field: string]: ResolverFn;
}

interface AppResolvers extends Resolvers {
  Launch: ResolverMap;
}

export const resolvers = {
  Launch: {
    isInCart: (launch: LaunchTileTypes.LaunchTile, _, { cache }): boolean => {
      const queryResult = cache.readQuery<GetCartItemTypes.GetCartItems>({
        query: GET_CART_ITEMS
      });
      if (queryResult) {
        return queryResult.cartItems.includes(launch.id);
      }
      return false;
    }
  }
};
