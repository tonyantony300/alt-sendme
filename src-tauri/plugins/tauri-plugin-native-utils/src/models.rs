use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectDonwloadFolderResponse {
    pub uri: String,
    pub path: String,
}
