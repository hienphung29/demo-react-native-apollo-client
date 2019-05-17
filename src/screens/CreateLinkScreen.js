import React, {Component, Fragment} from "react";
import {PixelRatio, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Mutation} from "react-apollo";
import gql from "graphql-tag";
import {GET_ALL_LINKS_QUERY} from "./HomeScreen";
import update from "immutability-helper";

const POST_MUTATION = gql`
	mutation PostMutation($description: String!, $url: String!) {
		post(description: $description, url: $url) {
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

class CreateLinkScreen extends Component {

	constructor(props) {
		super(props);
		console.log("Navigation params: ", this.props.navigation.state.params);
	}

	static navigationOptions = {
		title: "Create new link"
	};

	state = {
		url: "",
		description: ""
	};

	updateCache = (cache, {data: {post}}) => {
		const data = cache.readQuery({query: GET_ALL_LINKS_QUERY});
		const linkExists = data.feed.links.find(link => link.id === post.id);
		if(linkExists) {
			return;
		}
		const newData = update(data, {
			feed: {
				links: {
					$push: [post]
				}
			}
		});
		console.log("Writing new data: ", newData);
		cache.writeQuery({query: GET_ALL_LINKS_QUERY, data: newData});
	};

	render() {
		return (
			<View style={styles.container}>
				<Mutation mutation={POST_MUTATION}
				          variables={{url: this.state.url, description: this.state.description}}
				          update={this.updateCache}
				          onCompleted={() => this.props.navigation.goBack()}>
					{
						(mutate, {loading, error}) => {
							if (loading) {
								return <Text>Submitting...</Text>
							}
							if (error) {
								return <Text>Error: {error.message}</Text>
							}
							return (
								<Fragment>
									<TextInput style={styles.urlInput}
									           placeholder={"URL"}
									           onChangeText={(text) => this.setState({url: text})}/>
									<TextInput style={styles.descriptionInput}
									           placeholder={"Description"}
									           onChangeText={(text) => this.setState({description: text})}/>
									<TouchableOpacity onPress={mutate}>
										<View style={styles.submitButtonContainer}>
											<Text style={styles.submitButtonText}>Submit</Text>
										</View>
									</TouchableOpacity>
								</Fragment>
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
		backgroundColor: "white",
		alignItems: "stretch",
		justifyContent: "flex-start",
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 15,
	},
	urlInput: {
		height: 44,
		marginBottom: 10,
		borderWidth: 1 / PixelRatio.get(),
		borderColor: "lightgray",
		paddingHorizontal: 10,
		borderRadius: 5
	},
	descriptionInput: {
		height: 44,
		marginBottom: 10,
		borderWidth: 1 / PixelRatio.get(),
		borderColor: "lightgray",
		paddingHorizontal: 10,
		borderRadius: 5
	},
	submitButtonContainer: {
		alignSelf: "center",
		height: 44,
		width: 200,
		paddingHorizontal: 10,
		backgroundColor: "blue",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 5,
	},
	submitButtonText: {
		color: "white",
		fontWeight: "bold"
	}
});

export default CreateLinkScreen;