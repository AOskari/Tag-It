import React, {useContext, useEffect, useState} from "react";
import {SafeAreaView, ImageBackground} from "react-native";
import List from "../components/List";
import {MainContext} from "../contexts/MainContext";
import {useMedia} from "../hooks/ApiHooks";
import colors from "../global/colors.json";

/** Used for displaying the Home screen, which contains a list of recently added and popular posts. */
const Home = ({navigation}) => {
  const {darkMode, update, searchInput, setSearchInput} = useContext(MainContext);
  const {mediaArray} = useMedia(update);

  const [arr, setArr] = useState({});

  let bgColor;
  if (darkMode) bgColor = colors.dark_mode_bg;

  useEffect(() => {

    if (searchInput === "") {
      setArr(mediaArray);
      return;
    } 

    const filteredArray = mediaArray.filter(m => m.title.includes(searchInput) || m.description.includes(searchInput));

    setArr(filteredArray);

  }, [searchInput, mediaArray]);


  return (
    <SafeAreaView>
      <ImageBackground resizeMode="cover" style={{width: "100%", height: "100%"}} source={require('../images/mobile_background2_tagit.png')}>
        <List navigation={navigation} media={arr} />
      </ImageBackground>
    
    </SafeAreaView >
  );
};

export default Home;