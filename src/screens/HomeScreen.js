import React, {Component} from "react";
import {FlatList, PixelRatio, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Link from "../components/link/Link";
import {Query} from "react-apollo";
import gql from "graphql-tag";
import update from "immutability-helper";

export const GET_ALL_LINKS_QUERY = gql`
	query getAllLinks($skip: Int, $first: Int) {
		feed(skip: $skip, first: $first) @connection(key: "storeFeedTest") {
			links {
				id
				url
				description
				postedBy {
					name
					email
				}
				votes {
					count
				}
				createdAt
				fromMe @client
			}
		}
	}
`;

const NEW_LINK_SUBCRIPTION = gql`
	subscription {
		newLink {
			id
			url
			description
			postedBy {
				name
				email
			}
			votes {
				count
			}
			createdAt
			fromMe @client
		}
	}
`;

const MAX_ITEMS_PER_PAGE = 10;

class HomeScreen extends Component {

	static navigationOptions = {
		title: "Home"
	};

	constructor(props) {
		super(props);

		this.pagination = {
			skip: 0,
			first: MAX_ITEMS_PER_PAGE,
			endOfList: false
		}
	}


	renderItem = ({item, index}) => {
		return (
			<Link index={index} id={item.id} description={item.description} url={item.url} votes={item.votes}
			      postedBy={item.postedBy} createdAt={item.createdAt} fromMe={item.fromMe} pagination={this.pagination}
			      skip={item.skip} first={item.first}/>
		)
	};

	keyExtractor = (item) => {
		return item.id;
	};

	renderItemSeparator = () => {
		return (
			<View style={styles.divider}/>
		)
	};

	subcribeToNewLink = (subscribeToMore) => {
		subscribeToMore({
			document: NEW_LINK_SUBCRIPTION,
			updateQuery: (prev, {subscriptionData}) => {
				if (!subscriptionData.data) return prev;
				const newLink = subscriptionData.data.newLink;
				const exists = prev.feed.links.find(({id}) => id === newLink.id);
				if (exists) return prev;

				return Object.assign({}, prev, {
					feed: {
						links: [newLink, ...prev.feed.links],
						count: prev.feed.links.length + 1,
						__typename: prev.feed.__typename
					}
				});
			}
		});
	};

	loadMoreLinks = (fetchMore) => {
		if (this.pagination.endOfList) {
			return;
		}
		this.pagination.skip += MAX_ITEMS_PER_PAGE;
		const {skip, first} = this.pagination;
		fetchMore({
			query: GET_ALL_LINKS_QUERY,
			variables: {skip, first},
			updateQuery: (prev, {fetchMoreResult}) => {
				if (!fetchMoreResult || (fetchMoreResult.feed.links && fetchMoreResult.feed.links.length === 0)) {
					this.pagination.skip -= MAX_ITEMS_PER_PAGE;
					this.pagination.endOfList = true;
					return prev;
				}
				return update(prev, {
					feed: {
						links: {
							$push: [...fetchMoreResult.feed.links.map(link => ({...link, skip, first}))]
						}
					}
				});
			}
		});
	};

	render() {
		console.log("Render flatlist!!");


		const {skip, first} = this.pagination;
		return (
			<View style={styles.container}>
				<Query query={GET_ALL_LINKS_QUERY} variables={{skip, first}}>
					{
						({error, loading, data, fetchMore, subscribeToMore}) => {

							if (loading && !data.feed) {
								return (<Text>Fetching</Text>)
							}
							if (error) {
								return (<Text>Error: ${error.message}</Text>)
							}
							this.subcribeToNewLink(subscribeToMore);
							const {links = {}} = data.feed;
							return links && (
								<FlatList style={styles.list} contentContainerStyle={styles.container} data={links ? links : []}
								          renderItem={this.renderItem}
								          keyExtractor={this.keyExtractor}
								          ItemSeparatorComponent={this.renderItemSeparator}
								          onEndReachedThreshold={0.5}
								          onEndReached={() => this.loadMoreLinks(fetchMore)}
								/>
							)
						}
					}
				</Query>
				<View style={styles.footerContainer}>
					<TouchableOpacity onPress={() => {
						this.props.navigation.navigate("CreateLink");
					}}>
						<View style={styles.createMoreButtonContainer}>
							<Text style={styles.createMoreButtonText}>Create more</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	list: {},
	container: {
		backgroundColor: "white",
		alignItems: "stretch",
		justifyContent: "flex-start",
		paddingTop: 10,
		paddingBottom: 74
	},
	linksContainer: {
		alignItems: "stretch",
		justifyContent: "flex-start",
		flex: 1,
	},
	divider: {
		height: 1 / PixelRatio.get(),
		backgroundColor: "lightgray",
		marginVertical: 10
	},
	footerContainer: {
		position: "absolute",
		paddingVertical: 10,
		backgroundColor: "white",
		left: 0,
		right: 0,
		bottom: 0
	},
	createMoreButtonContainer: {
		backgroundColor: "blue",
		height: 44,
		justifyContent: 'center',
		alignItems: "center",
		marginHorizontal: 15,
		borderRadius: 5
	},
	createMoreButtonText: {
		color: "white",
		fontWeight: "bold"
	}
});

export default HomeScreen;