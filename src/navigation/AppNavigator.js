import React from "react";
import { View, Text } from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import HomeScreen from "../screens/HomeScreen";
import CreateLinkScreen from "../screens/CreateLinkScreen";

const RootNavigator = createStackNavigator({
	Home: {
		screen: HomeScreen
	},
	CreateLink: {
		screen: CreateLinkScreen
	}
});

const AppNavigator = createAppContainer(RootNavigator);

export default AppNavigator;