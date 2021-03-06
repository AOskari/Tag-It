import {useEffect, useState, useContext} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import data from "../global/tag.json";
import {MainContext} from "../contexts/MainContext";

const apiUrl = "https://media.mw.metropolia.fi/wbma/";
const tag = data.tag;

const useMedia = (update) => {
  const [mediaArray, setMediaArray] = useState(JSON);
  const [userMediaArray, setUserMediaArray] = useState(JSON);
  const [commentArray, setCommentArray] = useState(JSON);
  const {
    isLoggedIn,
    user,
    setUpdate,
    loadingMedia,
    setLoadingMedia,
    firstFetch,
    setFirstFetch,
    changingAccount,
    setChangingAccount,
    setLoadingComments,
    relogging,
    setRelogging,
  } = useContext(MainContext);

  // Call for getting all posts under the tag "tagit_"
  const getMedia = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const url = apiUrl + "media/";
    try {
      if (firstFetch || relogging) {
        await setLoadingMedia(true);
        console.log("loading media", true);
      }

      const response = await fetch(`${apiUrl}tags/${tag}`);
      const array = await response.json();
      let json = await Promise.all(
        array.map(async (item) => {
          const response = await fetch(url + item.file_id);
          const json = await response.json();

          // Fetching likes for the file and adding it to the json object.
          if (isLoggedIn || user.user_id == 676) {
            const options = {
              method: "GET",
              headers: {
                "x-access-token": token,
              },
            };

            // Fetching likes, user info and tags.
            const likes = await getFavourites(item.file_id);
            const user = await getUserInfo(item.user_id, options);
            const userAvatar = await getUserAvatar(item.user_id);
            let tags = await getMediaTags(item.file_id);

            // Filtering "tagit_" tag from the array of tags.

            tags = tags.filter(
              (t) =>
                t.tag !== tag &&
                !t.tag.includes("tagit_comment") &&
                !t.tag.includes("tagit_avatar")
            );

            if (tags[0] == undefined) return;
            else tags = tags[0].tag.split("_")[1];

            // Adding Like data to the JSON object
            json.likes = likes.amount;
            json.postLiked = likes.liked;
            json.userAvatar = userAvatar;
            // Adding thumbnail and user data to the JSON object
            const thumbnails = json.thumbnails;
            json.thumbnails = thumbnails.w640;
            json.user = user.username;
            json.user_email = user.email;
            json.user_id = user.user_id;
            json.tag = tags;
          }
          return json;
        })
      );
      json = json.filter((item) => item != undefined);
      setMediaArray(json);
      setUpdate(false);

      if (firstFetch) {
        console.log("loading media", false);
        await setFirstFetch(false);
      }
      await setRelogging(false);
      await setLoadingMedia(false);
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Call for getting all the comments, which for us are posts under the tag "tagit_comment_{file_id}"
  const getComments = async (post, signal) => {
    const token = await AsyncStorage.getItem("userToken");
    const url = apiUrl + "media/";
    try {
      const response = await fetch(`${apiUrl}tags/${tag}comment_${post}`, {
        signal: signal,
      });
      const array = await response.json();
      const json = await Promise.all(
        array.map(async (item) => {
          const response = await fetch(url + item.file_id, {signal: signal});
          const json = await response.json();

          // Fetching likes for the file and adding it to the json object.
          if (isLoggedIn) {
            const options = {
              method: "GET",
              headers: {
                "x-access-token": token,
              },
            };

            // Fetching likes, user info and tags.
            const likes = await getFavourites(item.file_id, signal);
            const user = await getUserInfo(item.user_id, options, signal);
            let tags = await getMediaTags(item.file_id, signal);

            // Filtering "tagit_" tag from the array of tags.
            tags = tags.filter((t) => t.tag != tag);
            if (tags[0] == undefined) tags = "main";
            else tags = tags[0].tag.split("_")[1];

            // Adding Like data to the JSON object
            json.likes = likes.amount;
            json.postLiked = likes.liked;

            // Adding user data to the JSON object
            json.user = user.username;
            json.user_email = user.email;
            json.user_id = user.user_id;
            json.tag = tags;
          }
          return json;
        })
      );
      setUpdate(false);
      return json;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Fetches all the likes for the chosen post.
  const getFavourites = async (id, signal) => {
    const token = await AsyncStorage.getItem("userToken");
    const options = {
      method: "GET",
      headers: {
        "x-access-token": token,
      },
    };
    let liked = false;
    const response = await fetch(`${apiUrl}favourites/file/${id}`, options, {
      signal: signal,
    });
    const json = await response.json();

    await json.map((like) => {
      if (like.user_id === user.user_id) liked = true;
    });

    return {amount: Object.keys(json).length, liked};
  };

  // Fetches user info with the given id.
  const getUserInfo = async (id, options, signal) => {
    const response = await fetch(`${apiUrl}users/${id}`, options, {
      signal: signal,
    });
    const user = await response.json();
    return user;
  };

  // Get tags for one post
  const getMediaTags = async (id, signal) => {
    const response = await fetch(`${apiUrl}tags/file/${id}`, {
      signal: signal,
    });
    const tags = await response.json();
    return tags;
  };

  // Get avatar for a user
  const getUserAvatar = async (id) => {
    const response = await fetch(`${apiUrl}tags/${tag}avatar_${id}`);
    const json = await response.json();
    if (response.ok && Object.keys(json).length > 0)
      return `${apiUrl}uploads/${json[0].filename}`;
    return "";
  };

  // Gets all the posts for the currently logged in user
  const getMyMedia = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const url = apiUrl + "media/";

    const options = {
      method: "GET",
      headers: {
        "x-access-token": token,
      },
    };

    try {
      const response = await fetch(`${apiUrl}media/user`, options);
      const array = await response.json();

      let json = await Promise.all(
        array.map(async (item) => {
          const response = await fetch(url + item.file_id);
          const json = await response.json();
          const userAvatar = await getUserAvatar(item.user_id);
          let tags = await getMediaTags(item.file_id);
          tags = tags.filter(
            (t) => t.tag !== "tagit_" && !t.tag.includes("tagit_avatar") && t.tag.includes("tagit_")
          );

          if (tags[0] == undefined) return;
          else tags = tags[0].tag.split("_")[1];

          // Adding user data to the JSON object
          json.user = user.username;
          json.user_email = user.email;
          json.user_id = user.user_id;
          json.tag = tags;
          json.userAvatar = userAvatar;

          return json;
        })
      );
      json = json.filter((item) => item != undefined);
      json = json.filter((item) => item.tag != undefined);
      setUserMediaArray(json);
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Gets all the posts for a specified user
  const getUserMedia = async (user) => {
    const token = await AsyncStorage.getItem("userToken");
    const url = apiUrl + "media/";
    console.log(user);

    const options = {
      method: "GET",
      headers: {
        "x-access-token": token,
      },
    };

    try {
      const response = await fetch(`${url}user/${user.user_id}`, options);
      const array = await response.json();
      let json = await Promise.all(
        array.map(async (item) => {
          const response = await fetch(url + item.file_id);
          const json = await response.json();
          const userAvatar = await getUserAvatar(item.user_id);
          let tags = await getMediaTags(item.file_id);
          tags = tags.filter(
            (t) => t.tag !== "tagit_" && !t.tag.includes("tagit_avatar") && t.tag.includes("tagit_")
          );
          if (tags[0] == undefined) return;
          else tags = tags[0].tag.split("_")[1];

          // Adding user data to the JSON object
          json.user = user.user;
          json.user_email = user.email;
          json.user_id = user.user_id;
          json.tag = tags;
          json.userAvatar = userAvatar;

          return json;
        })
      );
      json = json.filter((item) => item != undefined);
      json = json.filter((item) => item.tag != undefined);
      return json;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Creates a new post or a comment
  const postMedia = async (data, userTag) => {
    const token = await AsyncStorage.getItem("userToken");
    const realTag = tag + userTag;
    console.log(realTag);
    console.log(data);
    const options = {
      method: "POST",
      headers: {
        "x-access-token": token,
      },
      body: data,
    };

    try {
      const response = await fetch(apiUrl + "media/", options);
      console.log(response);
      if (!response.ok) {
        console.log(response);
        return new Error("Failed to upload data!");
      }
      console.log("Succesfully uploaded, now adding tag...");

      const json = await response.json();

      // Adding to the basic application tag, "tagit_"

      let tBody = {
        file_id: json.file_id,
        tag: tag,
      };

      let tOptions = {
        method: "POST",
        headers: {
          "x-access-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tBody),
      };

      let tResponse = await fetch(apiUrl + "tags", tOptions);
      if (!tResponse.ok) {
        console.log(tResponse);
        return new Error("Failed to create a tag!");
      }
      let tJson = await tResponse.json();

      console.log(tJson);

      // Adding to the user specified tag

      tBody = {
        file_id: json.file_id,
        tag: realTag,
      };

      tOptions = {
        method: "POST",
        headers: {
          "x-access-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tBody),
      };

      tResponse = await fetch(apiUrl + "tags", tOptions);
      if (!tResponse.ok) {
        console.log(tResponse);
        return new Error("Failed to create a tag!");
      }
      tJson = await tResponse.json();

      console.log(tJson);

      return tJson;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Deletes a post, used for both posts and comments as well as when deleting old avatars
  const deleteMedia = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    const options = {
      method: "DELETE",
      headers: {
        "x-access-token": token,
      },
    };
    try {
      const response = await fetch(apiUrl + "media/" + id, options);
      if (!response.ok) {
        return new Error("Failed to delete a post!");
      }
      const json = response.json();
      return json;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Delete old avatar to make room for new one
  const deleteAvatar = async () => {
    try {
      const response = await fetch(
        apiUrl + `tags/${tag}avatar_${user.user_id}`
      );
      const json = await response.json();
      const deleteResponse = await deleteMedia(json[0].file_id);
      return deleteResponse;
    } catch (e) {
      console.error(e);
    }
  };

  // Modify a post
  const putMedia = async (data, id) => {
    const token = await AsyncStorage.getItem("userToken");
    console.log(data);
    const options = {
      method: "PUT",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(apiUrl + "media/" + id, options);
      console.log(response);
      if (!response.ok) {
        return new Error("Failed to modify data!");
      }

      const json = await response.json();

      return json;
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Adds a like to a post, if the user has not liked it yet.
  const likeMedia = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    const options = {
      method: "POST",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({file_id: id}),
    };

    try {
      const response = await fetch(`${apiUrl}favourites`, options);
      if (response.ok) {
        console.log(`Liking of post_id ${id} was succesful`);
        return true;
      }
      return false;
    } catch (e) {
      console.log(`Failed to like post: ${e.message}`);
    }
  };

  // removes a like from a post.
  const removeLike = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    const options = {
      method: "DELETE",
      headers: {
        "x-access-token": token,
      },
    };
    try {
      const response = await fetch(`${apiUrl}favourites/file/${id}`, options);
      if (response.ok) {
        console.log(`Removal of like from post_id ${id} was succesful`);
        return true;
      }
      return false;
    } catch (e) {
      console.log(`Failed to remove like from post: ${e.message}`);
    }
  };

  useEffect(async () => {
    await getMedia();
    await getMyMedia();
  }, [update, isLoggedIn]);
  return {
    mediaArray,
    commentArray,
    userMediaArray,
    postMedia,
    deleteMedia,
    putMedia,
    likeMedia,
    removeLike,
    getFavourites,
    getComments,
    getUserAvatar,
    deleteAvatar,
    getUserMedia,
  };
};

const useLogin = () => {

};

const useUser = () => {

  // Login function
  const postLogin = async (userCredentials) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userCredentials),
    };
    try {
      const response = await fetch(apiUrl + "login", options);
      if (!response.ok) {
        return new Error("Failed to retrieve data!");
      }
      return response.json();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Get user based on token
  const getUserByToken = async (token) => {
    try {
      const options = {
        method: "GET",
        headers: {"x-access-token": token},
      };
      const response = await fetch(apiUrl + "users/user", options);
      const userData = await response.json();
      if (response.ok) {
        return userData;
      } else {
        throw new Error(userData.message);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // Get user based on user id
  const getUserById = async (id) => {
    const token = await AsyncStorage.getItem("userToken");
    try {
      const options = {
        method: "GET",
        headers: {"x-access-token": token},
      };
      const response = await fetch(apiUrl + "users/" + id, options);
      const userData = await response.json();
      if (response.ok) {
        return userData.username;
      } else {
        throw new Error(userData.message);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // Create a new user as well as log them in
  const postUser = async (data) => {
    console.log("postuser data:", data);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    try {
      const response = await fetch(apiUrl + "users", options);

      const loginOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "username": data.username,
          "password": data.password,
        }),
      };

      const loginResponse = await fetch(apiUrl + "login", loginOptions);
      if (!loginResponse.ok) {
        return new Error("Failed to retrieve data!");
      }

      return loginResponse.json();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  // Modify user information
  const putUser = async (data) => {
    const token = await AsyncStorage.getItem("userToken");
    console.log(data);
    const options = {
      method: "PUT",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    try {
      const response = await fetch(apiUrl + "users", options);
      if (!response.ok) {
        return new Error("Failed to modify a user!");
      }
      return response.json();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const checkUser = async (username) => {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await fetch(
        apiUrl + "users/username/" + username,
        options
      );
      const userData = await response.json();
      if (response.ok) {
        return userData.available;
      } else {
        throw new Error(userData.message);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return {postLogin, getUserByToken, postUser, checkUser, getUserById, putUser};
};

/** Gets all the tags containing "tagit_" */
const getTags = async () => {
  const token = await AsyncStorage.getItem("userToken");
  try {
    const options = {
      method: "GET",
      headers: {"x-access-token": token},
    };
    const response = await fetch(`${apiUrl}tags`, options);
    const tags = await response.json();

    const tagItTags = tags.filter((t) => t.tag.includes(tag));

    let tagsWithDuplicates = getTagsWithPostAmount(tagItTags);

    if (response.ok) {
      return tagsWithDuplicates;
    } else {
      throw new Error(userData.message);
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

/** Returns an array of tags displaying how many posts each tag has. */
const getTagsWithPostAmount = (array) => {
  const firstItem = array[0];
  firstItem.posts = 1;
  firstItem.tag = firstItem.tag.toLowerCase();
  let duplicates = [];
  duplicates.push(firstItem);

  for (let i = 0; i < array.length; i++) {
    if (
      !duplicates.some(
        (item) => item.tag.toLowerCase() === array[i].tag.toLowerCase()
      )
    ) {
      const newItem = array[i];
      newItem.posts = 1;
      newItem.tag = newItem.tag.toLowerCase();
      duplicates.push(newItem);
    } else {
      duplicates.map((item) => {
        if (item.tag.toLowerCase() === array[i].tag.toLowerCase()) item.posts++;
      });
    }
  }

  duplicates = duplicates.filter(
    (item) =>
      item.tag !== "tagit_" &&
      !item.tag.includes("tagit_comment") &&
      !item.tag.includes("tagit_avatar")
  );

  // Removing the "tagit_" portion of the tags.
  duplicates.map((item) => {
    const splitTag = item.tag.split("_");
    item.tag = splitTag[1].toLowerCase();
  });

  return duplicates;
};

export {useMedia, useLogin, useUser, getTags};
