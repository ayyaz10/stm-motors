import React, { useState } from "react";
import validateUKPostcode from "./validateUKPostcode";

interface PostcodeInputProps {
  onValidChange?: (isValid: boolean) => void;
  initialValue?: string;
  className?: string;
}

const PostcodeInput: React.FC<PostcodeInputProps> = ({
  onValidChange,
  initialValue = "",
  className = "",
}) => {
  const [postcode, setPostcode] = useState<string>(initialValue);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [touched, setTouched] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPostcode(value);

    // Only validate if field has been touched
    if (touched) {
      const valid = validateUKPostcode(value);
      setIsValid(valid);
      if (onValidChange) onValidChange(valid);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const valid = validateUKPostcode(postcode);
    setIsValid(valid);
    if (onValidChange) onValidChange(valid);
  };

  return (
    <div className={`postcode-container ${className}`}>
      <label htmlFor="postcode">UK Postcode</label>
      <input
        id="postcode"
        type="text"
        value={postcode}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="e.g. SW1A 1AA"
        className={`
          postcode-input ${className}
          ${touched && isValid === false ? "invalid" : ""}
          ${touched && isValid === true ? "valid" : ""}
        `}
        aria-invalid={touched && isValid === false}
      />

      {touched && isValid === false && (
        <span className="error-message" role="alert">
          Please enter a valid UK postcode
        </span>
      )}

      {touched && isValid === true && (
        <span className="success-message" role="status">
          ✓ Valid postcode
        </span>
      )}
    </div>
  );
};

export default PostcodeInput;
