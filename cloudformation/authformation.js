module.exports = {
  "AWSTemplateFormatVersion": "2010-09-09",
  "Mappings": {},
  "Metadata": {},
  "Resources": {
    "RestApi": {

    },
    "ApiRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "lambda.amazonaws.com"
                ],
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "BasicPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:AddPermission"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "AuthInstall": {
      "Type": "Custom::Install",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": [
            "LeoAuthInstall",
            "Arn"
          ]
        },
        "Version": "1.0.2"
      },
      "DependsOn": [
        "LeoAuthInstall",
        "LeoAuthPolicy",
        "LeoAuthIdentity",
        "LeoAuthUser",
        "LeoAuth"
      ]
    },
    "LeoAuth": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "identity",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "identity",
            "KeyType": "HASH"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": "100",
          "WriteCapacityUnits": "10"
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "addcc5fb-410b-412d-be0d-493cc91ad2e9"
        }
      }
    },
    "LeoAuthUser": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "identity_id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "identity_id",
            "KeyType": "HASH"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": "100",
          "WriteCapacityUnits": "10"
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "528ecd4d-1b8f-43c1-a793-b22d0333c4df"
        }
      }
    },
    "LeoAuthPolicy": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "name",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "name",
            "KeyType": "HASH"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": "3",
          "WriteCapacityUnits": "3"
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_IMAGE"
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "6dab2776-1bb2-4a3b-a692-ddd36cd32a53"
        }
      }
    },
    "LeoAuthIdentity": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {
            "AttributeName": "identity",
            "AttributeType": "S"
          },
          {
            "AttributeName": "policy",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "identity",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "policy",
            "KeyType": "RANGE"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": "5",
          "WriteCapacityUnits": "5"
        },
        "StreamSpecification": {
          "StreamViewType": "KEYS_ONLY"
        },
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "policy-identity-id",
            "KeySchema": [
              {
                "AttributeName": "policy",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "identity",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "KEYS_ONLY"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": "5",
              "WriteCapacityUnits": "5"
            }
          }
        ]
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "b6a65016-69fc-4796-bde6-3c6ab7c0edd0"
        }
      }
    },
    "LeoAuthPolicyEventSource": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "BatchSize": 1,
        "Enabled": true,
        "StartingPosition": "TRIM_HORIZON",
        "EventSourceArn": {
          "Fn::GetAtt": [
            "LeoAuthPolicy",
            "StreamArn"
          ]
        },
        "FunctionName": {
          "Ref": "LeoAuthWatch"
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "ae9721af-75ed-4ff9-b3e9-d7135b4568db"
        }
      },
      "DependsOn": [
        "LeoAuthPolicy"
      ]
    },
    "LeoAuthIdentityEventSource": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "BatchSize": 1,
        "Enabled": true,
        "StartingPosition": "TRIM_HORIZON",
        "EventSourceArn": {
          "Fn::GetAtt": [
            "LeoAuthIdentity",
            "StreamArn"
          ]
        },
        "FunctionName": {
          "Ref": "LeoAuthWatch"
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "91d08a05-c1d6-4bee-ade5-a8dc472e88d0"
        }
      },
      "DependsOn": [
        "LeoAuthIdentity"
      ]
    },
    "LeoAuthManagedPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:GetItem"
              ],
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "LeoAuth",
                    "Arn"
                  ]
                },
                {
                  "Fn::GetAtt": [
                    "LeoAuthUser",
                    "Arn"
                  ]
                }
              ]
            }
          ]
        }
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "e6d9c164-8136-451b-a718-cb47362ea052"
        }
      }
    },
    "LeoAuthRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "lambda.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "Leo_Auth_watch",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetRecords",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:GetShardIterator",
                    "dynamodb:DescribeStream",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-LeoAuth*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      },
      "Metadata": {
        "AWS::CloudFormation::Designer": {
          "id": "62149dca-9d39-4bb6-a5d6-2b84441f88ff"
        }
      }
    }
  },
  "Outputs": {
    "Policy": {
      "Description": "Policy for Read/Write to the Bus",
      "Value": {
        "Ref": "LeoAuthManagedPolicy"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Policy"
        }
      }
    },
    "LeoAuth": {
      "Description": "LeoAuth Table",
      "Value": {
        "Fn::Sub": "${LeoAuth}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LeoAuth"
        }
      }
    },
    "LeoAuthUser": {
      "Description": "LeoAuthUser Table",
      "Value": {
        "Fn::Sub": "${LeoAuthUser}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LeoAuthUser"
        }
      }
    }
  }
}

