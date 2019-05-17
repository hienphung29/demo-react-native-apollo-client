import gql from "graphql-tag"

export const typeDefs = gql`
	type Mutation {
		setProgramInfoModalVisible(isModalVisible: Boolean!): Boolean
	}
	type Query {
		isProgramInfoModalOpened: Boolean
	}
	extend type Program {
		loggedSessionIds: [Integer]!
	}
`