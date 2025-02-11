// landlord can register a property and update details

import { commonMiddleware } from "../../lib/commonMiddleware.js";
import createError from "http-errors";
import { v4 as uuid } from "uuid";
import { UserType } from "../../enums/CommonEnum.js";
import { PropertyStatus } from "../../enums/PropertyEnums.js";
import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const registerProperty = async (event, context) => {
  const { userId } = context.authorizer.claims;
  const { name, description, address, city, state, country, postalCode, propertyType, rent } = event.body;

  // Validate user type
  const user = await dynamoDb.get({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { userId },
  }).promise();

  if (user.Item.userType !== UserType.LANDLORD) {
    throw createError.Forbidden("Only landlords can register properties");
  }

  const property = {
    propertyId: uuid(),
    ownerId: userId,
    name,
    description,
    address,
    city,
    state,
    country,
    postalCode,
    propertyType,
    rent,
    status: PropertyStatus.PENDING,
    createdAt: new Date().toISOString(),
  };

  try {
    await dynamoDb.put({
      TableName: process.env.PROPERTIES_TABLE_NAME,
      Item: property,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(property),
    };
  } catch (error) {
    console.error(error);
    throw createError.InternalServerError(error);
  }
};

export const handler = commonMiddleware(registerProperty);