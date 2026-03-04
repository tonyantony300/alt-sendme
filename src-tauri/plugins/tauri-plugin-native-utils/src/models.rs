use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectDonwloadFolderResponse {
    pub uri: String,
    pub path: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedSendItemResponse {
    pub uri: String,
    pub path: String,
    pub cached_path: String,
}
