import { Link } from "expo-router";
import { Alert, Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";

const index = () => {

  return (
    <View style={styles.container}>

      <Image
          source={require('../assets/images/index/title.png')}
          style={styles.title}
      />

      <Link href="/join" asChild>
        <TouchableOpacity style={styles.button}>
          <Image
            source={require('../assets/images/index/play.png')}
            style={styles.imageButton}
          />
        </TouchableOpacity>
      </Link>

      <Link href="/join" asChild>
        <TouchableOpacity style={styles.button}>
          <Image
            source={require('../assets/images/index/settings.png')}
            style={styles.imageButton}
          />
        </TouchableOpacity>
      </Link>


      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert("Squabble Up")}
      >
        <Image
          source={require('../assets/images/index/help.png')} // or use a URI
          style={styles.helpButton}
        />
      </TouchableOpacity>

      <Image
          source={require('../assets/images/index/logo.png')}
          style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    width: 600,
    height: 140,
    borderRadius: 10,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  imageButton: {
    width: 250,
    height: 120,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  helpButton: {
    width: 150,
    height: 80,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BF00FF",
  },
  button: {
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
  position: 'absolute',
  bottom: 30,    // distance from the bottom edge
  right: 20,     // distance from the right edge
  width: 60,
  height: 60,
  resizeMode: 'contain',
},

});

export default index;
