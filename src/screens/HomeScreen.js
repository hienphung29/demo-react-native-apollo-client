import React, {Component} from "react";
import {
	ActivityIndicator,
	FlatList,
	PixelRatio,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
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

		this.endOfList = false;

		this.state = {
			refetching: false,
			fetchingMore: false,
		};

		this.links = [];
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

	loadMoreLinks = (fetchMore, skip) => {
		if (this.endOfList) {
			return;
		}
		fetchMore({
			query: GET_ALL_LINKS_QUERY,
			variables: {skip, MAX_ITEMS_PER_PAGE},
			updateQuery: (prev, {fetchMoreResult}) => {
				if (!fetchMoreResult) {
					return prev;
				} else if(fetchMoreResult.feed.links && fetchMoreResult.feed.links.length < MAX_ITEMS_PER_PAGE) {
					this.endOfList = true;
				}

				return update(prev, {
					feed: {
						links: {
							$push: [...fetchMoreResult.feed.links]
						}
					}
				});
			}
		});
	};

	renderFooterComponent = () => {
		return (
			<View style={styles.loadingMoreContainer}>
				<ActivityIndicator size={"small"} color={"black"}/>
			</View>
		)
	};

	renderFirstTimeLoading = () => {
		return (
			<View style={styles.firstTimeLoadingContainer}>
				<ActivityIndicator size={"large"} color={"black"}/>
			</View>
		)
	};

	render() {
		console.log("Render flatlist!!");

		return (
			<View style={styles.container}>
				<Query query={GET_ALL_LINKS_QUERY} variables={{skip: 0, MAX_ITEMS_PER_PAGE}} notifyOnNetworkStatusChange={true}>
					{
						({error, loading, data, fetchMore, refetch, subscribeToMore, networkStatus}) => {
							this.subcribeToNewLink(subscribeToMore);
							console.log("Network status: ", networkStatus);
							let links = [];
							let firstTimeLoading = false;
							let fetchingMore = false;
							let refetching = false;
							let ready = false;
							if (networkStatus < 7) { //Loading
								if (networkStatus === 1) {
									firstTimeLoading = true;
								} else if (networkStatus === 3) {
									fetchingMore = true;
								} else if (networkStatus === 4) {
									refetching = true;
								}
							} else {
								if (error) {
									return (<Text>Error: ${error.message}</Text>)
								}
								ready = true;
							}
							if(firstTimeLoading) {
								 return this.renderFirstTimeLoading();
							}
							else {
								if(ready) {
									this.links = data.feed.links || [];
								}
								return (
									<FlatList style={styles.list} contentContainerStyle={styles.listContainer} data={this.links}
									          renderItem={this.renderItem}
									          keyExtractor={this.keyExtractor}
									          ItemSeparatorComponent={this.renderItemSeparator}
									          onEndReachedThreshold={0.5}
									          onEndReached={() => {
									          	!fetchingMore && this.loadMoreLinks(fetchMore, this.links.length);
									          }}
									          ListFooterComponent={fetchingMore ? this.renderFooterComponent : null}
									          refreshControl={
										          <RefreshControl
											          refreshing={refetching}
											          onRefresh={refetch}
										          />
									          }
									          refreshing={refetching}
									/>
								)
							}
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
	container: {
		backgroundColor: "white",
		alignItems: "stretch",
		justifyContent: "flex-start",
		flex: 1
	},
	list: {
		flex: 1
	},
	listContainer: {
		paddingTop: 10,
		alignItems: "stretch",
		justifyContent: "flex-start",
		// flex: 1
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
		// position: "absolute",
		paddingVertical: 10,
		backgroundColor: "white",
		// left: 0,
		// right: 0,
		// bottom: 0
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
	},
	firstTimeLoadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: "center"
	},
	loadingMoreContainer: {
		alignItems: 'center',
		justifyContent: "center",
		padding: 10
	}
});

export default HomeScreen;