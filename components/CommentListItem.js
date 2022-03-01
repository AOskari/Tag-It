import React, {useState, useContext, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  ListItem as NBListItem,
  Text,
  Image,
  Icon,
} from "react-native-elements";
import {MainContext} from '../contexts/MainContext';
import {useMedia} from '../hooks/ApiHooks';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import colors from "../global/colors.json";
import ConfirmModal from './ConfirmModal';



const CommentListItem = ({singleComment}) => {
  const {darkMode, isLoggedIn, user, setDisplayConfirmWindow } = useContext(MainContext);
  const {likeMedia, removeLike, getFavourites, deleteMedia} = useMedia();
  const [currentLikes, setCurrentLikes] = useState(0);
  const [liked, setLiked] = useState(false);
 

  let bgColor,
    headerColor,
    headerTintColor,
    bgColorFaded,
    postLabelColor,
    highlightColor = colors.highlight_color;

  if (darkMode) {
    bgColor = colors.dark_mode_bg;
    headerColor = colors.dark_mode_header;
    bgColorFaded = colors.dark_mode_bg_faded;
    postLabelColor = colors.light_mode_header_tint;
    headerTintColor = colors.dark_mode_header_tint;
  } else {
    bgColor = colors.light_mode_bg;
    headerColor = colors.light_mode_header;
    bgColorFaded = colors.light_mode_header_faded;
    postLabelColor = colors.dark_mode_header_tint;
    headerTintColor = colors.light_mode_header_tint;
  }

  // Removes or adds a like depending on the liked status.
  const toggleLike = async () => {
    setLiked(!liked);
    if (liked) await removeLike(singleComment.file_id);
    else await likeMedia(singleComment.file_id);
    const newLikes = await getFavourites(singleComment.file_id);
    setCurrentLikes(newLikes.amount);
  }


  useEffect(() => {
    if (isLoggedIn) {
      setCurrentLikes(singleComment.likes);
      setLiked(singleComment.postLiked);
      console.log(currentLikes);
      console.log(liked)
    } else if (!isLoggedIn) {
      setCurrentLikes(0);
      setLiked(false);
    }

    console.log(`ListItem ${singleComment.title} rerendered.`);
  }, [singleComment])

  return (
    <NBListItem
      containerStyle={{
        backgroundColor: "transparent",
        padding: 0,
        paddingBottom: 1,
      }}
    >
      <NBListItem.Content>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignSelf: "center",
            width: "95%",
            height: "100%",
            display: "flex",
            borderRadius: 5,
            padding: 10,
            margin: 5,
            backgroundColor: bgColorFaded,
          }}
        >
          <View style={styles.commentText}>
            {singleComment.user && (
              <Text style={{color: headerTintColor, fontFamily: 'AdventPro', fontSize: 12}}>
                Posted by /user/{singleComment.user}
              </Text>
            )}
            <Text style={{color: headerTintColor, fontFamily: 'AdventPro', fontSize: 16}}>{singleComment.description}</Text>
          </View>
          <View style={styles.actions}>
            {singleComment.user === user.username &&
              <MaterialCommunityIcons name="delete" color={headerTintColor} size={30} onPress={() => setDisplayConfirmWindow(true)} />
            }
            {currentLikes >= 0 && <TouchableOpacity style={styles.likesContainer} onPress={toggleLike}>
              <MaterialCommunityIcons name="arrow-up-bold-outline" color={liked ? highlightColor : headerTintColor} size={30} />
              <Text style={{color: liked ? highlightColor : headerTintColor, fontSize: 15, fontFamily: 'AdventPro', }}>{currentLikes}</Text>
            </TouchableOpacity>
            }
          </View>

        </View>
        <ConfirmModal reason="delete_comment" id={singleComment.file_id} />

      </NBListItem.Content>
    </NBListItem>
  );
}

const styles = StyleSheet.create({
  commentText: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  actions: {
    flex: 1,
    alignItems: "flex-end"
  },
  likesContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CommentListItem;