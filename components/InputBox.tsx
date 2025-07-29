import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type InputBoxProps = Omit<TextInputProps, 'placeholder'> & {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<TextStyle>;
};

// === Corner Settings ===
const CORNER_SIZE = 20;
const CORNER_SCALE = 2;
const OFFSET = 2;

const Corner = ({
  position,
}: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}) => {
  const transforms = {
    topLeft: '0deg',
    topRight: '90deg',
    bottomRight: '180deg',
    bottomLeft: '270deg',
  };

  const styleMap = {
    topLeft: { top: OFFSET, left: OFFSET },
    topRight: { top: OFFSET, right: OFFSET },
    bottomLeft: { bottom: OFFSET, left: OFFSET },
    bottomRight: { bottom: OFFSET, right: OFFSET },
  };

  return (
    <View style={[styles.corner, styleMap[position]]}>
      <Svg
        width={CORNER_SIZE}
        height={CORNER_SIZE}
        viewBox="0 0 20 20"
        style={{
          transform: [
            { rotate: transforms[position] },
            { scale: CORNER_SCALE },
          ],
        }}
      >
        <Path d="M0 0 H20 V8 H8 V20 H0 Z" fill="black" />
      </Svg>
    </View>
  );
};

export function InputBox({
  placeholder,
  value,
  onChangeText,
  style,
  ...rest
}: InputBoxProps) {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    setSelection({ start: value.length, end: value.length });
  }, [value]);

  return (
    <View style={styles.wrapper}>
      {/* SVG Corner Brackets */}
      <Corner position="topLeft" />
      <Corner position="topRight" />
      <Corner position="bottomLeft" />
      <Corner position="bottomRight" />

      {/* Placeholder (when input is empty) */}
      {value.length === 0 && (
        <Text style={styles.placeholderText}>{placeholder}</Text>
      )}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        style={[styles.input, style]}
        underlineColorAndroid="transparent"
        selection={selection}
        onSelectionChange={({ nativeEvent }) =>
          setSelection(nativeEvent.selection)
        }
        selectionColor="black"
        caretHidden={false}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#000',
    width: 300,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#BF00FF",
    marginVertical: 15,
  },
  input: {
    fontSize: 36,
    fontFamily: 'Azonix',
    color: '#000',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  placeholderText: {
    position: 'absolute',
    fontSize: 36,
    fontFamily: 'Azonix',
    color: '#000',
    opacity: 0.3,
    textAlign: 'center',
    zIndex: 1,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    zIndex: 3,
  },
});

export default InputBox;
