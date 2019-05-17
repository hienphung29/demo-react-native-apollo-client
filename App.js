/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import ApolloClient from 'apollo-client';

import {InMemoryCache} from 'apollo-cache-inmemory'
import {ApolloProvider} from 'react-apollo';
import AppNavigator from "./src/navigation/AppNavigator";
import {WebSocketLink} from "apollo-link-ws";
import {getMainDefinition} from "apollo-utilities";
import {createHttpLink} from "apollo-link-http";
import {setContext} from "apollo-link-context";
import {split} from "apollo-link";
import gql from "graphql-tag";
import {typeDefs} from "./src/screens/Test";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjanZxOGprcXpnbmh0MGIzNTcwcGw5MThnIiwiaWF0IjoxNTU3OTg1ODQxfQ.yphL8at3Sz4Wim_NJnLijbIv2rsrJdlHHLB6atHyrCU";
const authLink = setContext((_, {headers}) => {
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : ""
		}
	};
});

const httpLink = createHttpLink({
	uri: "http://192.168.1.212:4000",
});


const wsLink = new WebSocketLink({
	uri: `ws://192.168.1.212:4000`,
	options: {
		reconnect: true,
		connectionParams: {
			authToken: token
		}
	}
});

const link = split(
	({query}) => {
		const {kind, operation} = getMainDefinition(query);
		return kind === "OperationDefinition" && operation === "subscription";
	},
	wsLink,
	authLink.concat(httpLink)
);

const client = new ApolloClient({
	link: link,
	cache: new InMemoryCache(),
	resolvers: {
		Link: {
			fromMe(link) {
				return link.postedBy.name === "Hien";
			}
		},
		Query: {
			test: () => "test"
		}
	},
	typeDefs: typeDefs
});

type Props = {};
export default class App extends Component<Props> {
	render() {
		return (
			<ApolloProvider client={client}>
				<AppNavigator/>
			</ApolloProvider>
		);
	}
}
