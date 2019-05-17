import React, {Component, PureComponent} from "react";
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import gql from "graphql-tag";
import {Mutation} from "react-apollo";
import {GET_ALL_LINKS_QUERY} from "../../screens/HomeScreen";
import update from "immutability-helper";

const DELETE_LINK = gql`
	mutation DeleteLink($id: ID!) {
		deleteLink(id: $id) {
			id
		}
	}
`;

class Link extends PureComponent {

	deleteLinkInCache = (cache, {data: {deleteLink: {id}}}) => {
		console.log("test");
		const data = cache.readQuery({query: GET_ALL_LINKS_QUERY});
		const newLinks = data.feed.links.filter(link => link.id !== id);
		const newData = update(data, {
			feed: {
				links: {
					$set: newLinks
				}
			}
		});
		cache.writeQuery({query: GET_ALL_LINKS_QUERY, data: newData});
		console.log("test1");
	};

	render() {
		const {index, id, description, url, postedBy, votes, createdAt, fromMe, skip, first} = this.props;
		console.log("Render link item at index: ", index);
		return (
			<View style={[styles.container, this.props.style]}>
				<View style={styles.leftContainer}>
					<Text>{index + 1}.</Text>
					<TouchableOpacity>
						<View style={styles.voteButtonContainer}>
							<Text style={styles.voteButtonText}>▲</Text>
						</View>
					</TouchableOpacity>
				</View>
				<View style={styles.mainContainer}>
					<Text>{description} ({url})</Text>
					<View style={styles.subtitleContainer}>
						<Text>{votes.count} votes</Text>
						<Text>|</Text>
						<Text>{fromMe ? "Me" : postedBy.name}</Text>
						<Text>{createdAt}</Text>
					</View>
				</View>
				<Mutation mutation={DELETE_LINK}
				          variables={{id}}
				          update={this.deleteLinkInCache}
				          optimisticResponse={
					          {
						          __typename: "Mutation",
				              deleteLink: {
						          	__typename: "Link",
					              id
				              }
					          }
				          }
				>
					{
						(deleteLink, {loading}) => {
							// if (loading) {
							// 	return (<ActivityIndicator size={"small"} color={"black"}/>)
							// }
							return (
								<TouchableOpacity style={styles.deleteButtonContainer}
								                  onPress={deleteLink}>
									<View style={styles.deleteButtonText}>
										<Text style={styles.deleteButtonText}>X</Text>
									</View>
								</TouchableOpacity>
							)
						}
					}
				</Mutation>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		justifyContent: "flex-start",
		alignItems: "stretch",
		flexDirection: "row",
		paddingHorizontal: 15,
	},
	leftContainer: {
		flexDirection: "row"
	},
	voteButtonContainer: {
		paddingHorizontal: 10
	},
	voteButtonText: {
		color: "black",
		fontSize: 16
	},
	mainContainer: {
		flex: 1
	},
	subtitleContainer: {
		flexDirection: "row"
	},
	deleteButtonContainer: {
		width: 30,
		height: 30,
		marginLeft: 10,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "red",
		borderRadius: 3,
	},
	deleteButtonText: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white"
	}
});

export default Link;